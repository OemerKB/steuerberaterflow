"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientBaseSchema, clientContactSchema, clientNoteSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/context";
import { logAudit, createNotification, notifyOrgMembers } from "@/lib/audit";
import { generateInvitationToken } from "@/lib/crypto";
import { invitationEmail, sendEmail } from "@/lib/adapters/email";
import { CLIENT_TYPE_LABELS } from "@/lib/labels";
import { clientProcessStatus } from "@/lib/workflow";

/** Berechnet Onboarding-Fortschritt (Checkliste). */
function computeOnboardingPercent(client, { hasContact, hasInvite }) {
  let done = 0;
  const total = 6;
  if (client.name) done++;
  if (client.type) done++;
  if (client.taxNumber || client.vatId) done++;
  if (hasContact) done++;
  if ((client.taxTypes || []).length > 0) done++;
  if (hasInvite) done++;
  return Math.round((done / total) * 100);
}

async function syncClientStatus(clientId) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      tasks: { where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] } }, select: { id: true, status: true } },
      documentRequests: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, include: { items: true } },
      approvals: { where: { status: "PENDING" }, select: { id: true } },
      conversations: {
        where: { type: "CLIENT", archivedAt: null },
        include: { messages: { where: { isInternal: false }, orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!client) return;
  const missingItems = client.documentRequests.reduce(
    (acc, r) => acc + r.items.filter((i) => i.status === "MISSING").length,
    0
  );
  const openQuestions = client.conversations.filter((c) => c.messages[0]?.senderId === null).length;
  const status = clientProcessStatus({
    missingItems,
    openQuestions,
    pendingApprovals: client.approvals.length,
    openTasks: client.tasks.length,
    inProgress: client.tasks.filter((t) => t.status === "IN_PROGRESS").length,
  });
  await prisma.client.update({
    where: { id: clientId },
    data: {
      onboardingPercent: computeOnboardingPercent(
        client,
        { hasContact: (client.contacts?.length || 0) > 0, hasInvite: Boolean(client.portalUserId) }
      ),
    },
  });
  return status;
}

/**
 * Neuer Mandant inkl. Onboarding: Stammdaten, Steuerarten, Ansprechpartner,
 * zuständiger Mitarbeiter und optionale Portaleinladung.
 */
export async function createClientAction(prevState, formData) {
  const { user, organization, role } = await guard("clients.create");

  const taxTypes = formData.getAll("taxTypes").map(String);
  const contactName = String(formData.get("contactName") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const sendInvite = formData.get("sendInvite") === "on";
  const responsibleUserId = String(formData.get("responsibleUserId") || "") || null;

  const parsed = clientBaseSchema.safeParse({
    type: formData.get("type") || "INDIVIDUAL",
    name: formData.get("name") || "",
    company: formData.get("company") || "",
    taxNumber: formData.get("taxNumber") || "",
    vatId: formData.get("vatId") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    street: formData.get("street") || "",
    postalCode: formData.get("postalCode") || "",
    city: formData.get("city") || "",
    responsibleUserId,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Bitte Eingaben prüfen." };
  }

  const baseSlug = `c-${Date.now().toString(36)}`;
  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      organizationId: organization.id,
      taxTypes,
    },
  });

  if (contactName) {
    await prisma.clientContact.create({
      data: {
        clientId: client.id,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        isPrimary: true,
      },
    });
  }

  // Benötigte Unterlagen (Onboarding) als erstes Unterlagenpaket anlegen
  const requiredDocuments = formData
    .getAll("requiredDocuments")
    .map(String)
    .map((t) => t.trim())
    .filter(Boolean);
  if (requiredDocuments.length > 0) {
    await prisma.documentRequest.create({
      data: {
        organizationId: organization.id,
        clientId: client.id,
        title: "Onboarding: benötigte Unterlagen",
        description: "Diese Unterlagen benötigen wir für die ordnungsgemäße Betreuung.",
        createdById: user.id,
        items: { create: requiredDocuments.map((title) => ({ title })) },
      },
    });
  }

  // Portaleinladung für Mandanten
  let invitationSent = false;
  const portalEmail = contactEmail || parsed.data.email;
  if (sendInvite && portalEmail) {
    const token = generateInvitationToken();
    await prisma.invitation.create({
      data: {
        organizationId: organization.id,
        email: portalEmail.toLowerCase(),
        name: contactName || parsed.data.name,
        role: "CLIENT",
        clientId: client.id,
        token,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${token}`;
    const mail = invitationEmail({
      organizationName: organization.name,
      inviterName: user.name,
      inviteUrl,
      role: "Mandant",
    });
    await sendEmail({ to: portalEmail, ...mail });
    invitationSent = true;
  }

  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "client.created",
    entityType: "Client",
    entityId: client.id,
    metadata: { name: parsed.data.name, invitationSent },
  });
  await notifyOrgMembers({
    organizationId: organization.id,
    exceptUserId: user.id,
    type: "client",
    title: "Neuer Mandant",
    body: `${parsed.data.name} wurde angelegt.`,
    link: `/clients/${client.id}`,
  });
  await syncClientStatus(client.id);

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true, clientId: client.id, invitationSent };
}

export async function updateClientAction(prevState, formData) {
  const { user, organization } = await guard("clients.update");
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organization.id },
  });
  if (!client) return { error: "Mandant nicht gefunden." };

  const responsibleUserIdRaw = String(formData.get("responsibleUserId") || "");
  const parsed = clientBaseSchema.safeParse({
    type: formData.get("type") || client.type,
    name: formData.get("name") || client.name,
    company: formData.get("company") ?? client.company,
    taxNumber: formData.get("taxNumber") ?? client.taxNumber,
    vatId: formData.get("vatId") ?? client.vatId,
    email: formData.get("email") ?? client.email,
    phone: formData.get("phone") ?? client.phone,
    street: formData.get("street") ?? client.street,
    postalCode: formData.get("postalCode") ?? client.postalCode,
    city: formData.get("city") ?? client.city,
    responsibleUserId: responsibleUserIdRaw || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Bitte Eingaben prüfen." };

  const taxTypes = formData.getAll("taxTypes").map(String);
  await prisma.client.update({ where: { id: clientId }, data: { ...parsed.data, taxTypes } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "client.updated",
    entityType: "Client",
    entityId: clientId,
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { success: "Stammdaten gespeichert." };
}

export async function archiveClientAction(formData) {
  const { user, organization } = await guard("clients.archive");
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) return { error: "Mandant nicht gefunden." };
  const nextStatus = client.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
  await prisma.client.update({ where: { id: clientId }, data: { status: nextStatus } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: nextStatus === "ARCHIVED" ? "client.archived" : "client.reactivated",
    entityType: "Client",
    entityId: clientId,
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: nextStatus === "ARCHIVED" ? "Mandant archiviert." : "Mandant reaktiviert." };
}

export async function addClientContactAction(prevState, formData) {
  const { user, organization } = await guard("clients.update");
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) return { error: "Mandant nicht gefunden." };
  const parsed = clientContactSchema.safeParse({
    name: formData.get("name") || "",
    role: formData.get("role") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    isPrimary: formData.get("isPrimary") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (parsed.data.isPrimary) {
    await prisma.clientContact.updateMany({ where: { clientId }, data: { isPrimary: false } });
  }
  await prisma.clientContact.create({ data: { ...parsed.data, clientId } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "client.contact_added",
    entityType: "Client",
    entityId: clientId,
  });
  revalidatePath(`/clients/${clientId}/kontakte`);
  return { success: "Ansprechpartner hinzugefügt." };
}

export async function addClientNoteAction(prevState, formData) {
  const { user, organization } = await guard("clients.update");
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) return { error: "Mandant nicht gefunden." };
  const parsed = clientNoteSchema.safeParse({
    content: formData.get("content") || "",
    isInternal: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  await prisma.clientNote.create({
    data: { clientId, authorId: user.id, content: parsed.data.content, isInternal: parsed.data.isInternal },
  });
  revalidatePath(`/clients/${clientId}/notizen`);
  return { success: "Notiz gespeichert." };
}

/** Portaleinladung nachsenden (falls beim Anlegen abgebrochen). */
export async function inviteClientPortalAction(prevState, formData) {
  const { user, organization } = await guard("clients.invite");
  const clientId = String(formData.get("clientId") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Bitte E-Mail-Adresse angeben." };
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) return { error: "Mandant nicht gefunden." };
  if (client.portalUserId) return { error: "Für diesen Mandanten existiert bereits ein Portalzugang." };

  const token = generateInvitationToken();
  await prisma.invitation.create({
    data: {
      organizationId: organization.id,
      email,
      name: client.name,
      role: "CLIENT",
      clientId,
      token,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const mail = invitationEmail({
    organizationName: organization.name,
    inviterName: user.name,
    inviteUrl: `${appUrl}/invite/${token}`,
    role: "Mandant",
  });
  const result = await sendEmail({ to: email, ...mail });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "client.portal_invited",
    entityType: "Client",
    entityId: clientId,
    metadata: { email, mode: result.mode },
  });
  revalidatePath(`/clients/${clientId}`);
  return {
    success:
      result.delivered
        ? "Einladung per E-Mail versendet."
        : "Einladung erstellt (E-Mail-Versand nicht konfiguriert – Einladungslink im Aktivitätsprotokoll bzw. an Kanzlei weitergeben).",
    inviteUrl: result.delivered ? null : `${appUrl}/invite/${token}`,
  };
}

export { syncClientStatus };

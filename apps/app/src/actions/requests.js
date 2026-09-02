"use server";

import { revalidatePath } from "next/cache";
import { documentRequestSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/context";
import { logAudit, createNotification } from "@/lib/audit";
import { requestProgress } from "@/lib/workflow";
import { reminderEmail, sendEmail, emailConfigured } from "@/lib/adapters/email";

/** Unterlagenpaket anlegen (z. B. „Monatsbuchhaltung August 2026"). */
export async function createRequestAction(prevState, formData) {
  const { user, organization } = await guard("requests.manage");
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) return { error: "Mandant nicht gefunden." };

  const itemTitles = formData
    .getAll("itemTitles")
    .map(String)
    .map((t) => t.trim())
    .filter(Boolean);
  const itemDueDates = formData.getAll("itemDueDates").map(String);

  const parsed = documentRequestSchema.safeParse({
    clientId,
    title: formData.get("title") || "",
    description: formData.get("description") || "",
    dueDate: formData.get("dueDate") || "",
    periodLabel: formData.get("periodLabel") || "",
    items: itemTitles.map((title, i) => ({ title, dueDate: itemDueDates[i] || "" })),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Bitte Eingaben prüfen." };

  const request = await prisma.documentRequest.create({
    data: {
      organizationId: organization.id,
      clientId,
      title: parsed.data.title,
      description: parsed.data.description,
      periodLabel: parsed.data.periodLabel,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      createdById: user.id,
      items: {
        create: parsed.data.items.map((i) => ({
          title: i.title,
          dueDate: i.dueDate ? new Date(i.dueDate) : null,
        })),
      },
    },
  });

  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "request.created",
    entityType: "DocumentRequest",
    entityId: request.id,
    metadata: { title: parsed.data.title, items: parsed.data.items.length },
  });
  if (client.portalUserId) {
    await createNotification({
      organizationId: organization.id,
      userId: client.portalUserId,
      type: "request",
      title: "Fehlende Unterlagen",
      body: `„${parsed.data.title}" – ${parsed.data.items.length} Unterlagen angefordert.`,
      link: "/portal/requests",
    });
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${clientId}`);
  return { success: "Unterlagenpaket erstellt.", requestId: request.id };
}

/** Status einer einzelnen angeforderten Unterlage ändern (z. B. als geprüft markieren). */
export async function updateRequestItemAction(formData) {
  const { user, organization } = await guard("requests.manage");
  const itemId = String(formData.get("itemId") || "");
  const status = String(formData.get("status") || "");
  if (!["MISSING", "UPLOADED", "ACCEPTED", "WAIVED"].includes(status)) {
    return { error: "Ungültiger Status." };
  }
  const item = await prisma.requestItem.findUnique({
    where: { id: itemId },
    include: { request: true },
  });
  if (!item || item.request.organizationId !== organization.id) {
    return { error: "Unterlage nicht gefunden." };
  }
  await prisma.requestItem.update({ where: { id: itemId }, data: { status } });
  const fresh = await prisma.documentRequest.findUnique({
    where: { id: item.requestId },
    include: { items: true },
  });
  const progress = requestProgress(fresh);
  await prisma.documentRequest.update({
    where: { id: item.requestId },
    data: { status: progress.missing === 0 ? "FULFILLED" : progress.provided > 0 ? "IN_PROGRESS" : "OPEN" },
  });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "request.item_status_changed",
    entityType: "RequestItem",
    entityId: itemId,
    metadata: { status, title: item.title },
  });
  revalidatePath("/requests");
  revalidatePath(`/clients/${item.request.clientId}`);
  return { success: "Status aktualisiert." };
}

/**
 * Erinnerung an Mandant – als sichere Demo-/Queue-Abstraktion.
 * Ohne E-Mail-Konfiguration wird nur protokolliert und eine Portal-Benachrichtigung erzeugt.
 */
export async function sendRequestReminderAction(formData) {
  const { user, organization } = await guard("requests.manage");
  const requestId = String(formData.get("requestId") || "");
  const request = await prisma.documentRequest.findFirst({
    where: { id: requestId, organizationId: organization.id },
    include: { client: true, items: true },
  });
  if (!request) return { error: "Anforderung nicht gefunden." };

  const progress = requestProgress(request);
  await prisma.documentRequest.update({
    where: { id: requestId },
    data: { updatedAt: new Date() },
  });
  await prisma.requestItem.updateMany({
    where: { requestId, status: "MISSING" },
    data: { remindedAt: new Date() },
  });

  let delivery = { delivered: false, mode: "demo" };
  if (request.client.portalUserId || request.client.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const mail = reminderEmail({
      clientName: request.client.name,
      requestTitle: request.title,
      missingCount: progress.missing,
      totalCount: progress.total,
      dueDate: request.dueDate ? new Intl.DateTimeFormat("de-DE").format(new Date(request.dueDate)) : "",
      portalUrl: `${appUrl}/portal/requests`,
    });
    delivery = await sendEmail({ to: request.client.email || `portal-${request.client.id}@demo.local`, ...mail });
    if (request.client.portalUserId) {
      await createNotification({
        organizationId: organization.id,
        userId: request.client.portalUserId,
        type: "reminder",
        title: "Erinnerung: Fehlende Unterlagen",
        body: `„${request.title}" – ${progress.missing} von ${progress.total} Unterlagen fehlen.`,
        link: "/portal/requests",
      });
    }
  }

  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "request.reminder_sent",
    entityType: "DocumentRequest",
    entityId: requestId,
    metadata: { mode: delivery.mode, missing: progress.missing },
  });
  revalidatePath("/requests");
  revalidatePath("/portal");
  return {
    success: emailConfigured && delivery.delivered
      ? "Erinnerung per E-Mail versendet."
      : "Erinnerung erzeugt (Demo-Modus: kein echter E-Mail-Versand konfiguriert) – Mandant sieht die Anforderung im Portal.",
  };
}

export async function cancelRequestAction(formData) {
  const { user, organization } = await guard("requests.manage");
  const requestId = String(formData.get("requestId") || "");
  const request = await prisma.documentRequest.findFirst({
    where: { id: requestId, organizationId: organization.id },
  });
  if (!request) return { error: "Anforderung nicht gefunden." };
  await prisma.documentRequest.update({ where: { id: requestId }, data: { status: "CANCELLED" } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "request.cancelled",
    entityType: "DocumentRequest",
    entityId: requestId,
  });
  revalidatePath("/requests");
  return { success: "Anforderung abgebrochen." };
}

"use server";

import { revalidatePath } from "next/cache";
import { organizationSettingsSchema, inviteMemberSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/context";
import { logAudit } from "@/lib/audit";
import { generateInvitationToken } from "@/lib/crypto";
import { invitationEmail, sendEmail } from "@/lib/adapters/email";

/* --------------------------- Kanzlei-Einstellungen -------------------------- */

export async function updateOrgSettingsAction(prevState, formData) {
  const { user, organization } = await guard("settings.manage");
  const parsed = organizationSettingsSchema.safeParse({
    name: formData.get("name") || organization.name,
    street: formData.get("street") || "",
    postalCode: formData.get("postalCode") || "",
    city: formData.get("city") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    timezone: formData.get("timezone") || "Europe/Berlin",
    locale: "de-DE",
    emailFromName: formData.get("emailFromName") || "",
    aiEnabled: formData.get("aiEnabled") === "on",
    aiSummaryEnabled: formData.get("aiSummaryEnabled") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await prisma.organization.update({ where: { id: organization.id }, data: { name: parsed.data.name } });
  await prisma.organizationSettings.upsert({
    where: { organizationId: organization.id },
    create: { organizationId: organization.id, ...parsed.data },
    update: { ...parsed.data },
  });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "settings.updated",
    entityType: "OrganizationSettings",
    entityId: organization.id,
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Kanzleieinstellungen gespeichert." };
}

/* --------------------------------- Team ------------------------------------ */

export async function inviteTeamMemberAction(prevState, formData) {
  const { user, organization } = await guard("team.manage");
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email") || "",
    name: formData.get("name") || "",
    role: formData.get("role") || "STAFF",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: organization.id, userId: existingUser.id } },
    });
    if (existingMembership) return { error: "Dieser Benutzer ist bereits Mitglied der Kanzlei." };
  }

  const token = generateInvitationToken();
  await prisma.invitation.create({
    data: {
      organizationId: organization.id,
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: parsed.data.role,
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
    role: parsed.data.role === "ACCOUNTANT" ? "Externer Buchhalter" : "Mitarbeiter",
  });
  const result = await sendEmail({ to: parsed.data.email, ...mail });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "team.member_invited",
    entityType: "Invitation",
    metadata: { email: parsed.data.email, role: parsed.data.role, mode: result.mode },
  });
  revalidatePath("/team");
  return {
    success: result.delivered
      ? "Einladung per E-Mail versendet."
      : "Einladung angelegt (Demo-Modus, kein E-Mail-Versand konfiguriert). Einladungslink: " + `${appUrl}/invite/${token}`,
  };
}

export async function revokeInvitationAction(formData) {
  const { user, organization } = await guard("team.manage");
  const invitationId = String(formData.get("invitationId") || "");
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, organizationId: organization.id },
  });
  if (!invitation) return { error: "Einladung nicht gefunden." };
  await prisma.invitation.update({ where: { id: invitationId }, data: { status: "REVOKED" } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "invitation.revoked",
    entityType: "Invitation",
    entityId: invitationId,
  });
  revalidatePath("/team");
  return { success: "Einladung widerrufen." };
}

export async function updateMemberRoleAction(formData) {
  const { user, organization } = await guard("team.manage");
  const membershipId = String(formData.get("membershipId") || "");
  const role = String(formData.get("role") || "");
  if (!["OWNER", "STAFF", "ACCOUNTANT"].includes(role)) return { error: "Ungültige Rolle." };
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: organization.id },
  });
  if (!membership) return { error: "Mitglied nicht gefunden." };
  if (membership.role === "OWNER" && role !== "OWNER") {
    // Sicherstellen, dass mind. ein OWNER bleibt
    const owners = await prisma.membership.count({ where: { organizationId: organization.id, role: "OWNER" } });
    if (owners <= 1) return { error: "Die Kanzlei braucht mindestens einen Inhaber." };
  }
  await prisma.membership.update({ where: { id: membershipId }, data: { role } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "team.role_changed",
    entityType: "Membership",
    entityId: membershipId,
    metadata: { role },
  });
  revalidatePath("/team");
  return { success: "Rolle aktualisiert." };
}

export async function deactivateMemberAction(formData) {
  const { user, organization } = await guard("team.manage");
  const membershipId = String(formData.get("membershipId") || "");
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: organization.id },
  });
  if (!membership) return { error: "Mitglied nicht gefunden." };
  if (membership.userId === user.id) return { error: "Sie können sich nicht selbst entfernen." };
  if (membership.role === "OWNER") return { error: "Inhaber können nicht entfernt werden – Rolle vorher ändern." };
  await prisma.membership.delete({ where: { id: membershipId } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "team.member_removed",
    entityType: "Membership",
    entityId: membershipId,
  });
  revalidatePath("/team");
  return { success: "Mitglied entfernt." };
}

/* ------------------------------ Benachrichtigungen ------------------------- */

export async function markNotificationReadAction(formData) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { error: "Nicht angemeldet." };
  const notificationId = String(formData.get("notificationId") || "");
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { error: "Nicht angemeldet." };
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
  return { success: "Alle Benachrichtigungen als gelesen markiert." };
}

export async function endSessionAction(formData) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { error: "Nicht angemeldet." };
  const sessionId = String(formData.get("sessionId") || "");
  const { prisma: db } = await import("@/lib/db");
  await db.session.deleteMany({ where: { id: sessionId, userId: session.user.id } });
  return { success: "Sitzung beendet." };
}

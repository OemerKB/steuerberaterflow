"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { loginSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, authenticate, setActiveOrganization } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { inviteAcceptSchema, passwordChangeSchema } from "@steuerberaterflow/validation";
import { verifyPassword } from "@/lib/crypto";

export async function loginAction(prevState, formData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") || "",
    password: formData.get("password") || "",
  });
  if (!parsed.success) {
    return { error: "Bitte gültige Zugangsdaten eingeben." };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") || "";
  const limit = rateLimit({ key: `login:${ip}`, limit: 10, windowMs: 5 * 60 * 1000 });
  if (!limit.allowed) {
    return { error: "Zu viele Anmeldeversuche. Bitte in wenigen Minuten erneut versuchen." };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "E-Mail oder Passwort ist nicht korrekt." };
  }

  await createSession(user.id, { userAgent: hdrs.get("user-agent") || "", ip });
  await logAudit({
    actorId: user.id,
    actorName: user.name,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    ip,
  });

  if (user.isPlatformAdmin) redirect("/admin");

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (memberships.length === 0) {
    return { error: "Ihr Konto ist keiner Organisation zugeordnet. Bitte Support kontaktieren." };
  }
  const clientMembership = memberships.find((m) => m.role === "CLIENT");
  if (clientMembership) {
    redirect("/portal");
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  const hdrs = await headers();
  await destroySession();
  redirect("/login");
}

/** Einladung annehmen: Account anlegen oder bestehenden Account verknüpfen. */
export async function acceptInvitationAction(prevState, formData) {
  const token = formData.get("token") || "";
  const parsed = inviteAcceptSchema.safeParse({
    name: formData.get("name") || "",
    password: formData.get("password") || "",
    passwordConfirm: formData.get("passwordConfirm") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Eingaben unvollständig." };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });
  if (!invitation) return { error: "Einladung nicht gefunden." };
  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return { error: "Diese Einladung ist nicht mehr gültig." };
  }

  let user = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (user) {
    if (verifyPassword(parsed.data.password, user.passwordHash)) {
      // Bestehender Account: nur Name aktualisieren, Passwort unverändert
      user = await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
    } else {
      return {
        error:
          "Für diese E-Mail existiert bereits ein Account. Bitte mit dem bestehenden Passwort fortfahren oder eine andere E-Mail verwenden.",
      };
    }
  } else {
    user = await prisma.user.create({
      data: {
        email: invitation.email,
        name: parsed.data.name,
        passwordHash: hashPassword(parsed.data.password),
      },
    });
  }

  const existingMembership = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
  });
  if (!existingMembership) {
    await prisma.membership.create({
      data: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role },
    });
  }
  if (invitation.role === "CLIENT" && invitation.clientId) {
    await prisma.client.updateMany({
      where: { id: invitation.clientId, portalUserId: null },
      data: { portalUserId: user.id },
    });
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  const hdrs = await headers();
  await createSession(user.id, { userAgent: hdrs.get("user-agent") || "" });
  await setActiveOrganization(invitation.organizationId);
  await logAudit({
    organizationId: invitation.organizationId,
    actorId: user.id,
    actorName: user.name,
    action: "invitation.accepted",
    entityType: "Invitation",
    entityId: invitation.id,
  });

  redirect(invitation.role === "CLIENT" ? "/portal" : "/dashboard");
}

export async function changePasswordAction(prevState, formData) {
  const session = await getSessionSafe();
  if (!session) return { error: "Nicht angemeldet." };
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword") || "",
    newPassword: formData.get("newPassword") || "",
    passwordConfirm: formData.get("passwordConfirm") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return { error: "Das aktuelle Passwort ist nicht korrekt." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  });
  await logAudit({
    organizationId: session.membership?.organizationId,
    actorId: user.id,
    actorName: user.name,
    action: "auth.password_changed",
    entityType: "User",
    entityId: user.id,
  });
  return { success: "Passwort aktualisiert." };
}

async function getSessionSafe() {
  const { getSession } = await import("@/lib/auth");
  return getSession();
}

export async function updateProfileAction(prevState, formData) {
  const session = await getSessionSafe();
  if (!session) return { error: "Nicht angemeldet." };
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { error: "Bitte Namen angeben." };
  const timezone = String(formData.get("timezone") || "Europe/Berlin");
  await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  await logAudit({
    organizationId: session.membership?.organizationId,
    actorId: session.user.id,
    actorName: name,
    action: "profile.updated",
  });
  return { success: "Profil gespeichert." };
}

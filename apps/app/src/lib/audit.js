import "server-only";
import { prisma } from "./db";

/**
 * Revisionsnahes Audit-Log (GoBD-Vorbereitung: unveränderlicher Anhang,
 * keine Lösch-API – Aufbewahrung wird in docs/security.md beschrieben).
 */
export async function logAudit({
  organizationId = null,
  actorId = null,
  actorName = "",
  action,
  entityType = "",
  entityId = "",
  metadata = {},
  ip = "",
}) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId,
        actorName,
        action,
        entityType,
        entityId,
        metadata,
        ip: ip ? String(ip).slice(0, 60) : "",
      },
    });
  } catch (err) {
    // Audit darf die Hauptaktion nicht blockieren, aber sichtbar fehlschlagen.
    console.error("audit-log-failed", err.message);
  }
}

export async function createNotification({ organizationId = null, userId, type, title, body = "", link = "", entityType = "", entityId = "" }) {
  if (!userId) return;
  await prisma.notification.create({
    data: { organizationId, userId, type, title, body, link, entityType, entityId },
  });
}

export async function notifyOrgMembers({ organizationId, roles = ["OWNER", "STAFF"], exceptUserId = null, ...rest }) {
  const memberships = await prisma.membership.findMany({
    where: { organizationId, role: { in: roles } },
    select: { userId: true },
  });
  for (const m of memberships) {
    if (exceptUserId && m.userId === exceptUserId) continue;
    await createNotification({ organizationId, userId: m.userId, ...rest });
  }
}

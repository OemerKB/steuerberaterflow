import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { prisma } from "./db";
import { can } from "./permissions";

/**
 * Serverseitige Guards für Layouts, Seiten und Server Actions.
 * Jede Route/Action ruft diese Guards auf – Tenant-Kontext kommt ausschließlich
 * aus der Session, nie aus Client-Input.
 */

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Kanzlei-Kontext (OWNER/STAFF/ACCOUNTANT). CLIENT-User werden ins Portal umgeleitet. */
export async function requireFirmContext() {
  const session = await requireSession();
  if (session.user.isPlatformAdmin && !session.membership) redirect("/admin");
  if (!session.membership) redirect("/login");
  if (session.membership.role === "CLIENT") redirect("/portal");
  const org = await prisma.organization.findUnique({
    where: { id: session.membership.organizationId },
    include: { settings: true },
  });
  if (!org || org.status === "SUSPENDED") {
    redirect("/login?error=gesperrt");
  }
  return { user: session.user, membership: session.membership, role: session.membership.role, organization: org };
}

/** Mandanten-Kontext (CLIENT-Rolle) inkl. zugehöriger Mandantenakte. */
export async function requireClientContext() {
  const session = await requireSession();
  if (!session.membership) redirect("/login");
  if (session.membership.role !== "CLIENT") redirect("/dashboard");
  const client = await prisma.client.findFirst({
    where: { organizationId: session.membership.organizationId, portalUserId: session.user.id },
    include: { organization: { include: { settings: true } } },
  });
  if (!client) redirect("/login?error=kein-portal");
  return {
    user: session.user,
    role: "CLIENT",
    client,
    organization: client.organization,
  };
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) redirect("/dashboard");
  return session;
}

/** Für Server Actions: wirft statt redirect (Actions dürfen nicht navigieren). */
export async function guard(permission) {
  const session = await getSession();
  if (!session || !session.membership) {
    const err = new Error("Nicht angemeldet.");
    err.code = "UNAUTHENTICATED";
    throw err;
  }
  if (!can(session.membership.role, permission)) {
    const err = new Error(`Keine Berechtigung: ${permission}`);
    err.code = "FORBIDDEN";
    throw err;
  }
  return session;
}

/** Guard für Portal-Actions: liefert Client-Akte des angemeldeten Mandanten. */
export async function guardPortal(permission) {
  const session = await getSession();
  if (!session || !session.membership || session.membership.role !== "CLIENT") {
    const err = new Error("Kein Portalzugriff.");
    err.code = "FORBIDDEN";
    throw err;
  }
  if (!can("CLIENT", permission)) {
    const err = new Error(`Keine Berechtigung: ${permission}`);
    err.code = "FORBIDDEN";
    throw err;
  }
  const client = await prisma.client.findFirst({
    where: { organizationId: session.membership.organizationId, portalUserId: session.user.id },
  });
  if (!client) {
    const err = new Error("Keine Mandantenakte verknüpft.");
    err.code = "FORBIDDEN";
    throw err;
  }
  return { user: session.user, client };
}

/**
 * Prüft, dass eine Entität zur Organisation gehört (Defense-in-Depth).
 * Entity muss organizationId tragen; für mandantengebundene Entitäten wird zusätzlich
 * geprüft, dass der Client zur Org gehört.
 */
export function assertOrgEntity(entity, organizationId) {
  if (!entity || entity.organizationId !== organizationId) {
    const err = new Error("Entität gehört nicht zur Organisation.");
    err.code = "FORBIDDEN";
    throw err;
  }
  return entity;
}

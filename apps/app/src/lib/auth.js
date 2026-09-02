import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { generateSessionToken, hashToken, verifyPassword } from "./crypto";
import { SESSION } from "@steuerberaterflow/config";

/**
 * Session-Management mit DB-Sessions und signiertem HttpOnly-Cookie.
 * Das Cookie enthält das rohe Token; in der DB liegt nur der SHA-256-Hash.
 */

export async function createSession(userId, { userAgent = "", ip = "" } = {}) {
  const { token, tokenHash } = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION.maxAgeSeconds * 1000);
  await prisma.session.create({
    data: { userId, tokenHash, userAgent: String(userAgent).slice(0, 250), ip: String(ip).slice(0, 60), expiresAt },
  });
  const jar = await cookies();
  jar.set(SESSION.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION.cookieName)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION.cookieName);
  jar.delete("sf_org");
}

/**
 * Lädt die aktuelle Session inkl. User, aktiver Membership und Organisation.
 * Rollenbasierte Weiterleitung: CLIENT → Portal, Kanzleirollen → App, Plattform-Admin → Admin.
 */
export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION.cookieName)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { memberships: { include: { organization: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  const user = session.user;
  const activeOrgCookie = jar.get("sf_org")?.value;

  let membership = null;
  if (activeOrgCookie) {
    membership = user.memberships.find((m) => m.organizationId === activeOrgCookie) || null;
  }
  if (!membership) membership = user.memberships[0] || null;

  return { user, membership, organization: membership?.organization || null };
}

export async function setActiveOrganization(organizationId) {
  const jar = await cookies();
  jar.set("sf_org", organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION.maxAgeSeconds,
    path: "/",
  });
}

export async function authenticate(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard", "/clients", "/documents", "/receipts", "/requests", "/tasks",
  "/deadlines", "/messages", "/appointments", "/approvals", "/reports",
  "/team", "/audit", "/settings", "/portal", "/admin", "/meeting",
];

/**
 * Leichter Edge-Guard: prüft nur das Vorhandensein des Session-Cookies.
 * Echte Autorisierung (Rolle, Tenant) passiert serverseitig in Layouts/Actions.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const session = request.cookies.get("sf_session")?.value;
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp|ico)).*)"],
};

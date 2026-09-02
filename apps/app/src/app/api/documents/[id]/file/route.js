import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

/**
 * Geschützter Dokument-Download/-Preview.
 * Session + Tenant-Prüfung serverseitig; keine öffentlichen URLs.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !session.membership) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      client: { select: { portalUserId: true } },
    },
  });
  if (!document) {
    return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
  }

  // Tenant-Isolation: Organisation muss übereinstimmen; Mandanten nur eigene Akte
  const isOrgMember = document.organizationId === session.membership.organizationId;
  const isPortalUser = session.membership.role === "CLIENT" && document.client?.portalUserId === session.user.id;
  if (!isOrgMember || (session.membership.role === "CLIENT" && !isPortalUser)) {
    await logAudit({
      organizationId: session.membership.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: "document.download_denied",
      entityType: "Document",
      entityId: id,
    });
    return NextResponse.json({ error: "Kein Zugriff auf dieses Dokument" }, { status: 403 });
  }

  const version = document.versions[0];
  if (!version) return NextResponse.json({ error: "Keine Datei vorhanden" }, { status: 404 });

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";

  await logAudit({
    organizationId: document.organizationId,
    actorId: session.user.id,
    actorName: session.user.name,
    action: download ? "document.downloaded" : "document.previewed",
    entityType: "Document",
    entityId: document.id,
  });

  const body = new Uint8Array(version.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": version.mimeType,
      "Content-Length": String(version.sizeBytes),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(version.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

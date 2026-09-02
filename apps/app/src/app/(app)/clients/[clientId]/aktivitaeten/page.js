import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from "@steuerberaterflow/ui";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Aktivitäten der Akte" };

export default async function ClientActivityPage({ params }) {
  const { clientId } = await params;
  const { organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: organization.id, entityId: clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitätsprotokoll</CardTitle>
        <p className="text-xs text-muted mt-1">Revisionsnahe Änderungshistorie dieser Mandantenakte.</p>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <EmptyState title="Keine Aktivitäten" description="Änderungen an dieser Akte werden hier protokolliert." />
        ) : (
          <ol className="space-y-0">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-3 py-2 border-b border-border/60 last:border-0">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{activityText(l)}</p>
                  <p className="text-[11px] text-muted">{formatDateTime(l.createdAt)} · {l.actorName || "System"}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function activityText(log) {
  const meta = typeof log.metadata === "object" ? log.metadata : {};
  switch (log.action) {
    case "document.uploaded": return `Dokument „${meta.fileName || ""}" hochgeladen`;
    case "document.uploaded_by_client": return `Dokument „${meta.fileName || ""}" vom Mandanten hochgeladen`;
    case "document.updated": return "Dokument-Metadaten aktualisiert";
    case "document.status_changed": return `Dokumentstatus geändert (${meta.from} → ${meta.to})`;
    case "document.downloaded": return "Dokument heruntergeladen";
    case "document.previewed": return "Dokument angesehen";
    case "document.version_uploaded": return `Version ${meta.version} hochgeladen`;
    case "request.created": return `Unterlagen angefordert: ${meta.title || ""}`;
    case "request.item_status_changed": return `Unterlage „${meta.title || ""}" → ${meta.status || ""}`;
    case "request.reminder_sent": return "Erinnerung zu fehlenden Unterlagen versendet";
    case "task.created": return `Aufgabe angelegt: ${meta.title || ""}`;
    case "task.status_changed": return `Aufgabenstatus geändert (${meta.from} → ${meta.to})`;
    case "deadline.created": return `Frist angelegt: ${meta.title || ""}`;
    case "deadline.completed": return "Frist erledigt";
    case "approval.requested": return `Freigabe angefordert: ${meta.title || ""}`;
    case "approval.decided_by_client": return `Mandant hat Freigabe bearbeitet (${meta.decision || ""})`;
    case "conversation.created": return "Neue Konversation gestartet";
    case "message.sent_by_client": return "Nachricht vom Mandanten gesendet";
    case "appointment.created": return "Termin angelegt";
    case "appointment.booked_by_client": return "Termin vom Mandanten gebucht";
    case "client.created": return "Mandantenakte angelegt";
    case "client.updated": return "Stammdaten aktualisiert";
    case "client.archived": return "Mandant archiviert";
    case "client.portal_invited": return `Portaleinladung versendet (${meta.email || ""})`;
    default: return log.action;
  }
}

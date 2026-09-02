import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, EmptyState, PageHeader } from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { ListTodo, FileQuestion, CalendarDays, Mail, CheckCheck, Clock } from "lucide-react";
import { formatDateTime, relativeDueDate } from "@/lib/labels";
import { requestProgress } from "@/lib/workflow";

export const metadata = { title: "Mein Portal" };

export default async function PortalHomePage() {
  const { user, client, organization } = await requireClientContext();

  const [tasks, requests, nextDeadline, nextAppointment, messages, approvals, lastDocument, latestReports] =
    await Promise.all([
      prisma.task.findMany({
        where: { organizationId: client.organizationId, clientId: client.id, status: "WAITING_CLIENT" },
        orderBy: { dueDate: "asc" },
        take: 4,
      }),
      prisma.documentRequest.findMany({
        where: { organizationId: client.organizationId, clientId: client.id, status: { in: ["OPEN", "IN_PROGRESS"] } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.deadline.findFirst({
        where: { organizationId: client.organizationId, clientId: client.id, status: { in: ["PLANNED", "IN_PROGRESS"] }, dueDate: { gte: new Date() } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.appointment.findFirst({
        where: { organizationId: client.organizationId, clientId: client.id, startsAt: { gte: new Date() }, status: { in: ["REQUESTED", "CONFIRMED"] } },
        orderBy: { startsAt: "asc" },
      }),
      prisma.conversation.findMany({
        where: { organizationId: client.organizationId, clientId: client.id, type: "CLIENT", archivedAt: null },
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { lastMessageAt: "desc" },
        take: 3,
      }),
      prisma.approvalRequest.findMany({
        where: { organizationId: client.organizationId, clientId: client.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.document.findFirst({
        where: { organizationId: client.organizationId, clientId: client.id, uploadedById: null },
        orderBy: { createdAt: "desc" },
      }),
      prisma.report.findMany({
        where: { organizationId: client.organizationId, clientId: client.id },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ]);

  const missingTotal = requests.reduce((acc, r) => acc + requestProgress(r).missing, 0);
  const greeting = new Date().getHours() < 11 ? "Guten Morgen" : new Date().getHours() < 18 ? "Guten Tag" : "Guten Abend";

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting}, ${client.name}!`}
        description={`${organization.name} · Ihr persönliches Mandantenportal`}
      />

      {/* Das ist jetzt zu erledigen */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Das ist jetzt zu erledigen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {tasks.length === 0 && missingTotal === 0 && approvals.length === 0 ? (
            <p className="text-sm text-muted py-2 text-center">Alles erledigt – nichts offen. 👍</p>
          ) : (
            <>
              {missingTotal > 0 ? (
                <Link href="/portal/requests" className="flex items-center gap-3 rounded-lg border border-warning/40 bg-warning-bg/60 px-3 py-2.5 hover:bg-warning-bg">
                  <FileQuestion className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-sm flex-1"><strong>{missingTotal}</strong> Unterlage(n) fehlen – bitte hochladen</p>
                  <Badge tone="amber">wichtig</Badge>
                </Link>
              ) : null}
              {tasks.map((t) => (
                <Link key={t.id} href="/portal/tasks" className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30">
                  <ListTodo className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm flex-1 truncate">{t.title}</p>
                  {t.dueDate ? <Badge tone="amber">{relativeDueDate(t.dueDate)?.label}</Badge> : null}
                </Link>
              ))}
              {approvals.map((a) => (
                <Link key={a.id} href="/portal/approvals" className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30">
                  <CheckCheck className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm flex-1 truncate">Freigabe erbeten: {a.title}</p>
                  <Badge tone="amber">offen</Badge>
                </Link>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Nächste Frist + Termin */}
        <Card>
          <CardHeader><CardTitle>Nächstes anstehendes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {nextAppointment ? (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary shrink-0"><CalendarDays className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-medium">{nextAppointment.title}</p>
                  <p className="text-xs text-muted">{formatDateTime(nextAppointment.startsAt)} · Beratungstermin</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 opacity-60">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/60 text-muted shrink-0"><CalendarDays className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm">Kein Termin geplant</p>
                  <Link href="/portal/appointments" className="text-xs sf-link">Termin buchen</Link>
                </div>
              </div>
            )}
            {nextDeadline ? (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-bg text-warning shrink-0"><Clock className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-medium">{nextDeadline.title}</p>
                  <p className="text-xs text-muted">Nächste Frist der Kanzlei · {formatDateTime(nextDeadline.dueDate)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">Keine Fristen anstehend.</p>
            )}
            <p className="text-[10px] text-muted/80 border-t border-border/60 pt-2">
              Fristen sind Vorlagen der Kanzlei – keine rechtsverbindliche Fristberechnung.
            </p>
          </CardContent>
        </Card>

        {/* Nachrichten */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Neue Nachrichten</CardTitle>
            <Link href="/portal/messages" className="text-xs sf-link">Alle</Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {messages.length === 0 ? (
              <p className="text-xs text-muted text-center py-2">Noch keine Nachrichten.</p>
            ) : (
              messages.map((c) => {
                const last = c.messages[0];
                return (
                  <Link key={c.id} href={`/portal/messages/${c.id}`} className="block rounded-lg border border-border px-3 py-2 hover:bg-accent/30">
                    <p className="text-sm font-medium truncate">{c.subject}</p>
                    <p className="text-xs text-muted truncate">{last ? last.content.slice(0, 70) : "–"}</p>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Unterlagen hochladen</h2>
        <UploadDropzone clientId={client.id} compact />
      </div>

      {/* Status der Kanzlei + letzter Upload */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Bearbeitungsstatus der Kanzlei</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Offene Aufgaben bei der Kanzlei</span><span>{tasks.length > 0 ? `${tasks.length} bei Ihnen` : "wird bearbeitet"}</span></div>
            <div className="flex justify-between"><span className="text-muted">Offene Freigaben</span><span>{approvals.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">Fehlende Unterlagen</span><span>{missingTotal}</span></div>
            {latestReports.length > 0 ? (
              <div className="border-t border-border pt-2">
                <p className="text-xs text-muted mb-1">Aktuelle Auswertungen:</p>
                {latestReports.map((r) => (
                  <Link key={r.id} href={`/portal/reports/${r.id}`} className="text-sm sf-link block truncate">{r.title}</Link>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Letzter Upload</CardTitle></CardHeader>
          <CardContent>
            {lastDocument ? (
              <div>
                <p className="text-sm font-medium truncate">{lastDocument.title}</p>
                <p className="text-xs text-muted">{formatDateTime(lastDocument.createdAt)}</p>
                <Link href="/portal/documents" className="text-xs sf-link mt-2 inline-block">Alle Dokumente</Link>
              </div>
            ) : (
              <p className="text-xs text-muted">Noch keine Dateien hochgeladen.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

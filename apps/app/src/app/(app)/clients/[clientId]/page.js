import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, EmptyState } from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { NewMessageDialog } from "@/components/new-message-dialog";
import { formatDateTime, relativeDueDate, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { requestProgress } from "@/lib/workflow";
import { CLIENT_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Mandantenakte" };

export default async function ClientOverviewPage({ params }) {
  const { clientId } = await params;
  const { role, organization } = await requireFirmContext();

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organization.id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      tasks: {
        where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] } },
        orderBy: [{ dueDate: "asc" }],
        take: 5,
      },
      deadlines: {
        where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
        orderBy: { dueDate: "asc" },
        take: 4,
      },
      documentRequests: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      appointments: {
        where: { startsAt: { gte: new Date() }, status: { in: ["REQUESTED", "CONFIRMED"] } },
        orderBy: { startsAt: "asc" },
        take: 3,
      },
      documents: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, createdAt: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!client) notFound();

  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  const totalMissing = client.documentRequests.reduce((acc, r) => acc + requestProgress(r).missing, 0);

  return (
    <div className="space-y-5">
      {/* Onboarding-Fortschritt */}
      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <div>
            <CardTitle>Onboarding</CardTitle>
            <CardDescription>Einrichtungsfortschritt der Mandantenakte</CardDescription>
          </div>
          <span className="text-lg font-semibold text-primary">{client.onboardingPercent}%</span>
        </CardHeader>
        <CardContent>
          <div className="h-1.5 rounded-full bg-accent/50 overflow-hidden" role="progressbar" aria-valuenow={client.onboardingPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-primary rounded-full" style={{ width: `${client.onboardingPercent}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>{client.taxTypes.length ? `Steuerarten: ${client.taxTypes.join(", ")}` : "Keine Steuerarten erfasst"}</span>
            <span>{client.contacts.length} Ansprechpartner</span>
            <span>{client.portalUserId ? "Portalzugang aktiv" : "Kein Portalzugang"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Links: Fehlende Unterlagen + Aufgaben + Fristen */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <div>
                <CardTitle>Fehlende Unterlagen</CardTitle>
                <CardDescription>{totalMissing > 0 ? `${totalMissing} Unterlage(n) offen` : "Alles vollständig"}</CardDescription>
              </div>
              <NewRequestDialog clients={[{ id: client.id, name: client.name }]} defaultClientId={client.id} />
            </CardHeader>
            <CardContent className="space-y-3">
              {client.documentRequests.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Keine offenen Anforderungen.</p>
              ) : (
                client.documentRequests.map((r) => {
                  const p = requestProgress(r);
                  return (
                    <div key={r.id}>
                      <div className="flex items-center justify-between text-sm">
                        <Link href="/requests" className="font-medium hover:text-primary truncate">{r.title}</Link>
                        <Badge tone={p.missing > 0 ? "amber" : "green"}>{p.missing > 0 ? `${p.missing} von ${p.total} fehlen` : "vollständig"}</Badge>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-accent/50 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.percent}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Offene Aufgaben</CardTitle>
              <NewTaskDialog clients={[{ id: client.id, name: client.name }]} staff={staff} defaultClientId={client.id} />
            </CardHeader>
            <CardContent className="space-y-2">
              {client.tasks.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Keine offenen Aufgaben.</p>
              ) : (
                client.tasks.map((t) => {
                  const due = relativeDueDate(t.dueDate);
                  return (
                    <Link key={t.id} href="/tasks" className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 hover:bg-accent/30">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{t.title}</p>
                        <p className="text-xs text-muted">{t.dueDate ? relativeDueDate(t.dueDate)?.label : "ohne Fälligkeit"}</p>
                      </div>
                      <Badge tone={TASK_PRIORITY_LABELS[t.priority] === "Dringend" ? "red" : "gray"}>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Bevorstehende Fristen</CardTitle>
              <Link href={`/clients/${client.id}/fristen`} className="text-xs sf-link">Alle</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.deadlines.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Keine Fristen geplant.</p>
              ) : (
                client.deadlines.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{d.title}</p>
                      <p className="text-xs text-muted">{formatDateTime(d.dueDate)}</p>
                    </div>
                    <Badge tone={relativeDueDate(d.dueDate)?.tone === "red" ? "red" : "gray"}>{relativeDueDate(d.dueDate)?.label}</Badge>
                  </div>
                ))
              )}
              <p className="text-[10px] text-muted/80 border-t border-border/60 pt-1.5">Fristen sind Vorlagen – fachlich durch die Kanzlei zu prüfen.</p>
            </CardContent>
          </Card>
        </div>

        {/* Rechts: Kontakte, Termine, letzte Dokumente */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Ansprechpartner</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {client.contacts.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Noch keine Kontakte.</p>
              ) : (
                client.contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{c.name} {c.isPrimary ? <Badge tone="green" className="ml-1">primär</Badge> : null}</p>
                      <p className="text-xs text-muted truncate">{c.email || c.phone || c.role || "–"}</p>
                    </div>
                  </div>
                ))
              )}
              <Link href={`/clients/${client.id}/kontakte`} className="text-xs sf-link block pt-1">Verwalten</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Nächste Termine</CardTitle>
              <NewAppointmentDialog clients={[{ id: client.id, name: client.name }]} staff={staff} defaultClientId={client.id} />
            </CardHeader>
            <CardContent className="space-y-2">
              {client.appointments.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Keine Termine geplant.</p>
              ) : (
                client.appointments.map((a) => (
                  <div key={a.id}>
                    <p className="text-sm truncate">{a.title}</p>
                    <p className="text-xs text-muted">{formatDateTime(a.startsAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Letzte Dokumente</CardTitle>
              <Link href={`/clients/${client.id}/dokumente`} className="text-xs sf-link">Alle</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.documents.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Noch keine Dokumente.</p>
              ) : (
                client.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2">
                    <p className="text-sm truncate">{d.title}</p>
                    <span className="text-[10px] text-muted shrink-0">{formatDateTime(d.createdAt)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload für diese Akte */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Dokument zu dieser Akte hochladen</h2>
        <UploadDropzone clientId={client.id} compact />
      </div>
    </div>
  );
}

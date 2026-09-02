import Link from "next/link";
import {
  Users, ListTodo, AlertTriangle, FileQuestion, CheckCheck, CalendarClock,
  CalendarDays, Mail, Plus, ArrowRight, Activity,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard, Badge, Button,
  EmptyState, Avatar, PageHeader,
} from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { NewMessageDialog } from "@/components/new-message-dialog";
import {
  DEADLINE_STATUS_TONES, formatDateTime, relativeDueDate,
  TASK_PRIORITY_LABELS,
} from "@/lib/labels";
import { isTaskOverdue } from "@/lib/workflow";

export const metadata = { title: "Übersicht" };

export default async function DashboardPage() {
  const { user, role, organization } = await requireFirmContext();
  const orgId = organization.id;

  const [
    activeClients,
    openTasksRaw,
    missingItems,
    pendingApprovals,
    upcomingDeadlinesRaw,
    todayAppointments,
    unreadMessages,
    recentAudit,
    staffMemberships,
    clientsWithMissing,
    recentActivities,
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    prisma.task.findMany({
      where: { organizationId: orgId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] } },
      include: { client: { select: { name: true } }, assignee: { select: { name: true } } },
    }),
    prisma.requestItem.count({
      where: { status: "MISSING", request: { organizationId: orgId, status: { in: ["OPEN", "IN_PROGRESS"] } } },
    }),
    prisma.approvalRequest.count({ where: { organizationId: orgId, status: "PENDING" } }),
    prisma.deadline.findMany({
      where: { organizationId: orgId, status: { in: ["PLANNED", "IN_PROGRESS"] }, dueDate: { lte: new Date(Date.now() + 30 * 864e5) } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { client: { select: { name: true } } },
    }),
    prisma.appointment.findMany({
      where: {
        organizationId: orgId,
        startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
        status: { in: ["CONFIRMED", "REQUESTED"] },
      },
      include: { client: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.conversation.count({
      where: {
        organizationId: orgId, type: "CLIENT", archivedAt: null,
        messages: { some: { senderId: null } },
        reads: { none: { userId: user.id } },
      },
    }),
    prisma.auditLog.count({ where: { organizationId: orgId } }),
    prisma.membership.findMany({
      where: { organizationId: orgId, role: { in: ["OWNER", "STAFF"] } },
      include: { user: { select: { name: true } } },
    }),
    // Mandanten mit fehlenden Unterlagen
    prisma.client.findMany({
      where: {
        organizationId: orgId, status: "ACTIVE",
        documentRequests: { some: { status: { in: ["OPEN", "IN_PROGRESS"] }, items: { some: { status: "MISSING" } } } },
      },
      include: {
        documentRequests: {
          where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
          include: { items: { where: { status: "MISSING" } } },
        },
      },
      take: 5,
    }),
    // Letzte Mandantenaktivitäten (Uploads/Freigaben durch Mandanten)
    prisma.auditLog.findMany({
      where: { organizationId: orgId, action: { in: ["document.uploaded_by_client", "approval.decided_by_client", "message.sent_by_client", "appointment.booked_by_client"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const overdueTasks = openTasksRaw.filter((t) => isTaskOverdue(t));
  const myTasks = openTasksRaw.filter((t) => t.assigneeId === user.id);
  const todayDeadlines = upcomingDeadlinesRaw.filter((d) => new Date(d.dueDate) <= new Date(new Date().setHours(23, 59, 59, 999)));

  // Auslastung nach Mitarbeiter
  const workload = staffMemberships.map((m) => ({
    name: m.user.name,
    open: openTasksRaw.filter((t) => t.assigneeId === m.userId).length,
    overdue: overdueTasks.filter((t) => t.assigneeId === m.userId).length,
  })).sort((a, b) => b.open - a.open);
  const maxWorkload = Math.max(1, ...workload.map((w) => w.open));

  const unreadNotifications = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  const clients = await prisma.client.findMany({
    where: { organizationId: orgId, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const staff = await prisma.membership.findMany({
    where: { organizationId: orgId, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  const actionLabels = {
    "document.uploaded_by_client": "hat Dokumente hochgeladen",
    "approval.decided_by_client": "hat eine Freigabe bearbeitet",
    "message.sent_by_client": "hat eine Nachricht gesendet",
    "appointment.booked_by_client": "hat einen Termin angefragt",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Guten Tag, ${user.name.split(" ")[0]}`}
        description={`${organization.name} · ${new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}`}
        actions={
          <div className="hidden md:flex gap-2">
            <Link href="/clients/new"><Button variant="secondary" size="sm"><Plus className="h-3.5 w-3.5" /> Mandant</Button></Link>
            <NewMessageDialog clients={clients} trigger={<Button variant="secondary" size="sm">Nachricht</Button>} />
            <NewRequestDialog clients={clients} />
          </div>
        }
      />

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard label="Aktive Mandanten" value={activeClients} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Offene Aufgaben" value={openTasksRaw.length} hint={`${myTasks.length} bei mir`} icon={<ListTodo className="h-4 w-4" />} />
        <StatCard label="Überfällige Aufgaben" value={overdueTasks.length} tone={overdueTasks.length ? "red" : "neutral"} icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Fehlende Unterlagen" value={missingItems} tone={missingItems ? "amber" : "neutral"} icon={<FileQuestion className="h-4 w-4" />} />
        <StatCard label="Offene Freigaben" value={pendingApprovals} icon={<CheckCheck className="h-4 w-4" />} />
        <StatCard label="Fristen ≤ 30 Tage" value={upcomingDeadlinesRaw.length} icon={<CalendarClock className="h-4 w-4" />} />
        <StatCard label="Termine heute" value={todayAppointments.length} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard label="Neue Nachrichten" value={unreadMessages} tone={unreadMessages ? "green" : "neutral"} icon={<Mail className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Heute wichtig */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between flex">
            <div>
              <CardTitle>Heute wichtig</CardTitle>
              <CardDescription>Überfälliges, Fälliges und heutige Termine</CardDescription>
            </div>
            <Badge tone={overdueTasks.length || todayDeadlines.length ? "red" : "green"}>
              {overdueTasks.length + todayDeadlines.length > 0 ? `${overdueTasks.length + todayDeadlines.length} kritisch` : "Alles im Griff"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.map((a) => (
              <Link key={a.id} href="/appointments" className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-bg text-info shrink-0"><CalendarDays className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title} · {a.client.name}</p>
                  <p className="text-xs text-muted">
                    {new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(a.startsAt))} Uhr · {a.durationMinutes} Min.
                    {a.meetingRoom ? " · Meetingraum verfügbar" : ""}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted shrink-0" />
              </Link>
            ))}
            {overdueTasks.slice(0, 4).map((t) => (
              <Link key={t.id} href="/tasks" className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger shrink-0"><ListTodo className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-danger">{t.client ? `${t.client.name} · ` : ""}{relativeDueDate(t.dueDate)?.label}</p>
                </div>
                <Badge tone="red">{TASK_PRIORITY_LABELS[t.priority]}</Badge>
              </Link>
            ))}
            {todayDeadlines.map((d) => (
              <Link key={d.id} href="/deadlines" className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-bg text-warning shrink-0"><CalendarClock className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted">{d.client ? `${d.client.name} · ` : ""}{formatDateTime(d.dueDate)}</p>
                </div>
                <Badge tone="red">heute</Badge>
              </Link>
            ))}
            {overdueTasks.length === 0 && todayDeadlines.length === 0 && todayAppointments.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                title="Nichts Dringendes heute"
                description="Keine überfälligen Aufgaben, keine Fristen heute. Zeit für Beratung."
                action={<Link href="/tasks"><Button variant="secondary" size="sm">Aufgaben öffnen</Button></Link>}
              />
            ) : null}
          </CardContent>
        </Card>

        {/* Schnell-Upload + Quick Actions */}
        <div className="space-y-5">
          <UploadDropzone clientId={null} compact />
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Link href="/clients/new" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30"><Plus className="h-3.5 w-3.5 text-primary" /> Mandant hinzufügen</Link>
              <NewTaskDialog clients={clients} staff={staff} trigger={
                <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30 text-left cursor-pointer"><Plus className="h-3.5 w-3.5 text-primary" /> Aufgabe erstellen</button>
              } />
              <NewRequestDialog clients={clients} trigger={
                <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30 text-left cursor-pointer"><Plus className="h-3.5 w-3.5 text-primary" /> Dokument anfordern</button>
              } />
              <NewAppointmentDialog clients={clients} staff={staff} trigger={
                <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30 text-left cursor-pointer"><Plus className="h-3.5 w-3.5 text-primary" /> Termin planen</button>
              } />
              <NewMessageDialog clients={clients} trigger={
                <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30 text-left cursor-pointer"><Plus className="h-3.5 w-3.5 text-primary" /> Nachricht senden</button>
              } />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Bevorstehende Fristen */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Bevorstehende Fristen</CardTitle>
            <Link href="/deadlines" className="text-xs sf-link">Alle</Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {upcomingDeadlinesRaw.length === 0 ? (
              <p className="text-xs text-muted py-3 text-center">Keine Fristen in den nächsten 30 Tagen.</p>
            ) : (
              upcomingDeadlinesRaw.map((d) => {
                const due = relativeDueDate(d.dueDate);
                return (
                  <div key={d.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{d.title}</p>
                      <p className="text-xs text-muted">{d.client ? `${d.client.name} · ` : ""}{formatDateTime(d.dueDate)}</p>
                    </div>
                    <Badge tone={due?.tone === "red" ? "red" : due?.tone === "amber" ? "amber" : "gray"}>{due?.label}</Badge>
                  </div>
                );
              })
            )}
            <p className="text-[10px] text-muted/80 pt-1 border-t border-border/60">
              Fristen sind Vorlagen der Kanzlei – keine rechtsverbindliche Fristberechnung.
            </p>
          </CardContent>
        </Card>

        {/* Mandanten mit fehlenden Unterlagen */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Fehlende Unterlagen</CardTitle>
            <Link href="/requests" className="text-xs sf-link">Alle</Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {clientsWithMissing.length === 0 ? (
              <p className="text-xs text-muted py-3 text-center">Alle Unterlagen liegen vor. 👍</p>
            ) : (
              clientsWithMissing.map((c) => {
                const missing = c.documentRequests.reduce((acc, r) => acc + r.items.length, 0);
                return (
                  <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center justify-between gap-2 hover:bg-accent/30 rounded-md px-1 py-0.5">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted">{c.documentRequests[0]?.title}</p>
                    </div>
                    <Badge tone="amber">{missing} fehlen</Badge>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Auslastung */}
        <Card>
          <CardHeader>
            <CardTitle>Auslastung nach Mitarbeiter</CardTitle>
            <CardDescription>Offene Aufgaben im Team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workload.map((w) => (
              <div key={w.name} className="flex items-center gap-3">
                <Avatar name={w.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate">{w.name}</span>
                    <span className="text-muted shrink-0">{w.open} offen{w.overdue ? ` · ${w.overdue} überfällig` : ""}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-accent/50 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((w.open / maxWorkload) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Offene Freigaben */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Offene Freigaben</CardTitle>
            <Link href="/approvals" className="text-xs sf-link">Alle</Link>
          </CardHeader>
          <CardContent>
            <OpenApprovals orgId={orgId} />
          </CardContent>
        </Card>

        {/* Letzte Mandantenaktivitäten */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Mandantenaktivitäten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-muted py-3 text-center">Noch keine Aktivitäten.</p>
            ) : (
              recentActivities.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{a.actorName} {actionLabels[a.action] || a.action}</p>
                    <p className="text-xs text-muted">{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function OpenApprovals({ orgId }) {
  const approvals = await prisma.approvalRequest.findMany({
    where: { organizationId: orgId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { client: { select: { name: true } } },
  });
  if (approvals.length === 0) {
    return <p className="text-xs text-muted py-3 text-center">Keine offenen Freigaben.</p>;
  }
  return (
    <div className="space-y-2.5">
      {approvals.map((a) => (
        <Link key={a.id} href="/approvals" className="flex items-center justify-between gap-2 hover:bg-accent/30 rounded-md px-1 py-0.5">
          <div className="min-w-0">
            <p className="text-sm truncate">{a.title}</p>
            <p className="text-xs text-muted">{a.client.name} · seit {formatDateTime(a.createdAt)}</p>
          </div>
          <Badge tone="amber">wartet</Badge>
        </Link>
      ))}
    </div>
  );
}

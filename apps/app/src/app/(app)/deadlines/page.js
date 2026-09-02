import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Card, CardHeader, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { CompleteDeadlineButton } from "@/components/task-row-actions";
import { NewDeadlineDialog } from "@/components/new-deadline-dialog";
import { DEADLINE_STATUS_LABELS, DEADLINE_STATUS_TONES, TASK_PRIORITY_LABELS, formatDateTime, relativeDueDate, formatDate } from "@/lib/labels";
import { isDeadlineOverdue } from "@/lib/workflow";
import { RecurrenceBadge } from "./recurrence-badge";

export const metadata = { title: "Fristen" };

export default async function DeadlinesPage({ searchParams }) {
  const { role, organization } = await requireFirmContext();
  const params = await searchParams;
  const view = params?.view === "calendar" ? "calendar" : "list";

  const deadlines = await prisma.deadline.findMany({
    where: { organizationId: organization.id, status: { notIn: [] } },
    include: { client: { select: { id: true, name: true } }, assignee: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  const clientsList = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const staffList = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });
  const staffForDialog = staffList.map((s) => ({ id: s.userId, name: s.user.name }));

  // Kalenderansicht: nächstes Monat
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const byDay = {};
  for (const d of deadlines) {
    const due = new Date(d.dueDate);
    if (due >= monthStart && due <= monthEnd) {
      const key = due.getDate();
      (byDay[key] = byDay[key] || []).push(d);
    }
  }
  const daysInMonth = monthEnd.getDate();
  const firstWeekday = (monthStart.getDay() + 6) % 7; // Montag = 0

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fristen"
        description={`${deadlines.filter((d) => d.status !== "DONE").length} offene Fristen · Listen- und Kalenderansicht`}
        actions={
          <div className="flex gap-2">
            <a href={`/deadlines?view=${view === "calendar" ? "list" : "calendar"}`} className="h-8 px-3 inline-flex items-center rounded-lg border border-border bg-card text-xs font-medium hover:bg-accent/40">
              {view === "calendar" ? "Listenansicht" : "Kalenderansicht"}
            </a>
            {can(role, "deadlines.manage") ? <NewDeadlineDialog clients={clientsList} staff={staffForDialog} /> : null}
          </div>
        }
      />

      {view === "calendar" ? (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold">{new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(now)}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label="Fristenkalender">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                <div key={d} className="text-[10px] font-semibold text-muted uppercase py-1">{d}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const items = byDay[day] || [];
                const isToday = now.getDate() === day && now.getMonth() === monthStart.getMonth();
                return (
                  <div key={day} className={`min-h-16 rounded-md border p-1 text-left ${isToday ? "border-primary bg-accent/30" : "border-border"}`}>
                    <p className={`text-[10px] font-semibold ${isToday ? "text-primary" : "text-muted"}`}>{day}</p>
                    {items.slice(0, 2).map((d) => (
                      <p key={d.id} className="text-[9px] truncate rounded bg-warning-bg text-warning px-1 mt-0.5" title={d.title}>{d.title}</p>
                    ))}
                    {items.length > 2 ? <p className="text-[9px] text-muted mt-0.5">+{items.length - 2}</p> : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-4 space-y-2">
          {deadlines.length === 0 ? (
            <EmptyState title="Keine Fristen" description="Legen Sie manuelle oder wiederkehrende Fristen an." />
          ) : (
            deadlines.map((d) => {
              const overdue = isDeadlineOverdue(d);
              const rel = relativeDueDate(d.dueDate);
              return (
                <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-xs text-muted">
                      {d.client ? `${d.client.name} · ` : ""}
                      {formatDateTime(d.dueDate)}
                      {d.assignee?.name ? ` · ${d.assignee.name}` : ""}
                      {" · "}Erinnerung {d.reminderDays} Tage vorher
                    </p>
                  </div>
                  {d.recurrence !== "NONE" ? <RecurrenceBadge recurrence={d.recurrence} /> : null}
                  <Badge tone={PRIORITY_TONES[d.priority]}>{TASK_PRIORITY_LABELS[d.priority]}</Badge>
                  <Badge tone={overdue ? "red" : DEADLINE_STATUS_TONES[d.status]}>
                    {overdue && d.status !== "DONE" ? "Überfällig" : DEADLINE_STATUS_LABELS[d.status]}
                  </Badge>
                  {can(role, "deadlines.manage") && d.status !== "DONE" ? <CompleteDeadlineButton deadlineId={d.id} /> : null}
                </div>
              );
            })
          )}
          <p className="text-[10px] text-muted/80 pt-1 border-t border-border/60">
            Wichtig: Fristen sind Vorlagen und Erinnerungshilfen – keine garantiert rechtsverbindliche
            Fristautomatik. Fristen durch die Kanzlei fachlich prüfen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const PRIORITY_TONES = { LOW: "gray", MEDIUM: "blue", HIGH: "amber", URGENT: "red" };

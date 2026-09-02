import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { TaskRowActions } from "@/components/task-row-actions";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { TASK_STATUS_LABELS, TASK_STATUS_TONES, TASK_PRIORITY_LABELS, formatDateTime, relativeDueDate } from "@/lib/labels";

export const metadata = { title: "Aufgaben der Akte" };

export default async function ClientTasksPage({ params }) {
  const { clientId } = await params;
  const { role, organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id, clientId, status: { notIn: ["ARCHIVED"] } },
    include: { assignee: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>Aufgaben ({tasks.length})</CardTitle>
        {can(role, "tasks.create") ? (
          <NewTaskDialog clients={[{ id: client.id, name: client.name }]} staff={staff} defaultClientId={client.id} />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <EmptyState title="Keine Aufgaben" description="Für diesen Mandanten sind keine Aufgaben offen." />
        ) : (
          tasks.map((t) => {
            const rel = t.dueDate ? relativeDueDate(t.dueDate) : null;
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted">
                    {t.assignee?.name ? `${t.assignee.name} · ` : ""}
                    {t.dueDate ? formatDateTime(t.dueDate) : "ohne Fälligkeit"}
                    {rel ? ` · ${rel.label}` : ""}
                  </p>
                </div>
                <Badge tone={TASK_PRIORITY_TONES_SAFE[t.priority]}>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                <Badge tone={TASK_STATUS_TONES[t.status]}>{TASK_STATUS_LABELS[t.status]}</Badge>
                {can(role, "tasks.update") ? <TaskRowActions taskId={t.id} currentStatus={t.status} /> : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

const TASK_PRIORITY_TONES_SAFE = { LOW: "gray", MEDIUM: "blue", HIGH: "amber", URGENT: "red" };

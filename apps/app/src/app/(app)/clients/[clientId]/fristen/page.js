import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { CompleteDeadlineButton } from "@/components/task-row-actions";
import { DEADLINE_STATUS_LABELS, DEADLINE_STATUS_TONES, TASK_PRIORITY_LABELS, formatDateTime, relativeDueDate } from "@/lib/labels";
import { isDeadlineOverdue } from "@/lib/workflow";

export const metadata = { title: "Fristen der Akte" };

export default async function ClientDeadlinesPage({ params }) {
  const { clientId } = await params;
  const { role, organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const deadlines = await prisma.deadline.findMany({
    where: { organizationId: organization.id, clientId, status: { notIn: [] } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fristen ({deadlines.length})</CardTitle>
        <p className="text-xs text-muted mt-1">Vorlagen der Kanzlei – Fristen sind fachlich zu prüfen, keine rechtsverbindliche Fristberechnung.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {deadlines.length === 0 ? (
          <EmptyState title="Keine Fristen" description="Für diesen Mandanten sind keine Fristen angelegt." />
        ) : (
          deadlines.map((d) => {
            const overdue = isDeadlineOverdue(d);
            const rel = relativeDueDate(d.dueDate);
            return (
              <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted">{formatDateTime(d.dueDate)} · Erinnerung {d.reminderDays} Tage vorher</p>
                </div>
                <Badge tone={TASK_PRIORITY_TONES[d.priority]}>{TASK_PRIORITY_LABELS[d.priority]}</Badge>
                <Badge tone={overdue ? "red" : DEADLINE_STATUS_TONES[d.status]}>
                  {overdue && d.status !== "DONE" ? "Überfällig" : DEADLINE_STATUS_LABELS[d.status]}
                </Badge>
                {can(role, "deadlines.manage") && d.status !== "DONE" ? (
                  <CompleteDeadlineButton deadlineId={d.id} />
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

const TASK_PRIORITY_TONES = { LOW: "gray", MEDIUM: "blue", HIGH: "amber", URGENT: "red" };

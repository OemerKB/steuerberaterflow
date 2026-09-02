import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { PortalTaskReplyButton } from "./portal-task-button";
import { TASK_STATUS_LABELS, formatDateTime, relativeDueDate } from "@/lib/labels";

export const metadata = { title: "Meine Aufgaben" };

export default async function PortalTasksPage() {
  const { client } = await requireClientContext();

  const tasks = await prisma.task.findMany({
    where: { organizationId: client.organizationId, clientId: client.id, status: { notIn: ["ARCHIVED"] } },
    include: { checklist: { orderBy: { position: "asc" } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <Card>
      <CardHeader><CardTitle>Aufgaben der Kanzlei ({tasks.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <EmptyState title="Keine Aufgaben" description="Es sind derzeit keine Aufgaben für Sie offen." />
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="rounded-lg border border-border px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{t.title}</p>
                <div className="flex items-center gap-2">
                  {t.dueDate ? <Badge tone={t.status === "WAITING_CLIENT" ? "amber" : "gray"}>{relativeDueDate(t.dueDate)?.label || formatDateTime(t.dueDate)}</Badge> : null}
                  <Badge tone={t.status === "WAITING_CLIENT" ? "amber" : t.status === "DONE" ? "green" : "gray"}>{TASK_STATUS_LABELS[t.status]}</Badge>
                  {t.status === "WAITING_CLIENT" ? <PortalTaskReplyButton taskId={t.id} /> : null}
                </div>
              </div>
              {t.description ? <p className="text-xs text-muted mt-1 whitespace-pre-wrap">{t.description}</p> : null}
              {t.checklist.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {t.checklist.map((c) => (
                    <li key={c.id} className="text-xs flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${c.done ? "bg-primary" : "bg-border"}`} />
                      {c.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

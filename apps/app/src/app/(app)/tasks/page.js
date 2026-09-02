import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Badge } from "@steuerberaterflow/ui";
import { TasksBoard } from "./tasks-board";
import { NewTaskDialog } from "@/components/new-task-dialog";

export const metadata = { title: "Aufgaben" };

export default async function TasksPage({ searchParams }) {
  const { user, role, organization } = await requireFirmContext();
  const params = await searchParams;
  const view = params?.view === "kanban" ? "kanban" : "list";
  const mine = params?.mine === "1" || params?.mine === "true";
  const filter = params?.filter || "open";

  const where = {
    organizationId: organization.id,
    ...(mine ? { assigneeId: user.id } : {}),
    ...(filter === "open"
      ? { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] } }
      : filter === "overdue"
        ? { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] }, dueDate: { lt: new Date() } }
        : filter === "client"
          ? { status: "WAITING_CLIENT" }
          : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
      checklist: { orderBy: { position: "asc" } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 400,
  });

  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aufgaben"
        description={`${tasks.length} Aufgabe(n) · Listen- und Kanbanansicht`}
        actions={
          can(role, "tasks.create") ? <NewTaskDialog clients={clients} staff={staff} /> : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <a href="/tasks" className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${filter === "open" ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:bg-accent/40"}`}>Offen</a>
        <a href="/tasks?filter=overdue" className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${filter === "overdue" ? "bg-danger-bg text-danger border-danger" : "border-border bg-card hover:bg-accent/40"}`}>Überfällig</a>
        <a href="/tasks?filter=client" className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${filter === "client" ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:bg-accent/40"}`}>Wartet auf Mandant</a>
        <a href="/tasks?mine=1" className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${mine ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:bg-accent/40"}`}>Meine Aufgaben</a>
        <span className="flex-1" />
        <a href={`/tasks?view=${view === "kanban" ? "list" : "kanban"}${mine ? "&mine=1" : ""}${filter !== "open" ? `&filter=${filter}` : ""}`} className="h-8 px-3 inline-flex items-center rounded-lg border border-border bg-card text-xs font-medium hover:bg-accent/40">
          {view === "kanban" ? "Listenansicht" : "Kanban-Ansicht"}
        </a>
      </div>

      <TasksBoard tasks={tasks} view={view} canUpdate={can(role, "tasks.update")} />
    </div>
  );
}

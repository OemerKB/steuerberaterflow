"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge, Card, CardHeader, CardTitle, CardContent, EmptyState } from "@steuerberaterflow/ui";
import { updateTaskStatusAction, toggleChecklistItemAction } from "@/actions/tasks";
import { TaskRowActions } from "@/components/task-row-actions";
import {
  TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, formatDateTime, relativeDueDate,
  TASK_STATUS_TONES,
} from "@/lib/labels";
import { isTaskOverdue } from "@/lib/workflow";

const KANBAN_COLUMNS = ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM", "DONE"];

export function TasksBoard({ tasks, view, canUpdate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(taskId, status) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("taskId", taskId);
      formData.set("status", status);
      const res = await updateTaskStatusAction(formData);
      if (res?.error) toast.error(res.error);
      else if (res?.success) {
        toast.success(res.success);
        router.refresh();
      }
    });
  }

  if (view === "kanban") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 overflow-x-auto sf-scroll">
        {KANBAN_COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col || (col === "OPEN" && t.status === "ARCHIVED" && false));
          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("text/task-id");
                if (taskId && canUpdate) changeStatus(taskId, col);
              }}
              className="rounded-lg bg-card border border-border p-2 min-h-40"
            >
              <div className="flex items-center justify-between px-1.5 pb-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">{TASK_STATUS_LABELS[col]}</p>
                <Badge tone="gray">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <TaskCard key={t.id} task={t} draggable={canUpdate} canUpdate={canUpdate} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState title="Keine Aufgaben" description="Es gibt keine Aufgaben in dieser Ansicht." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        {tasks.map((t) => {
          const overdue = isTaskOverdue(t);
          const rel = t.dueDate ? relativeDueDate(t.dueDate) : null;
          const doneChecklist = t.checklist.filter((c) => c.done).length;
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${t.status === "DONE" ? "line-through text-muted" : ""}`}>{t.title}</p>
                <p className="text-xs text-muted">
                  {t.client ? <Link href={`/clients/${t.client.id}`} className="hover:text-primary">{t.client.name} · </Link> : null}
                  {t.assignee?.name ? `${t.assignee.name} · ` : ""}
                  {t.dueDate ? formatDateTime(t.dueDate) : "ohne Fälligkeit"}
                  {t.checklist.length > 0 ? ` · Checkliste ${doneChecklist}/${t.checklist.length}` : ""}
                </p>
              </div>
              {overdue ? <Badge tone="red">überfällig</Badge> : null}
              <Badge tone={PRIORITY_TONES[t.priority]}>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
              <Badge tone={TASK_STATUS_TONES[t.status]}>{TASK_STATUS_LABELS[t.status]}</Badge>
              {canUpdate ? <TaskRowActions taskId={t.id} currentStatus={t.status} /> : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, draggable, canUpdate }) {
  const overdue = isTaskOverdue(task);
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
      className={`rounded-lg border border-border bg-background/60 p-2.5 ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${overdue ? "border-danger/50" : ""}`}
    >
      <p className={`text-sm font-medium leading-snug ${task.status === "DONE" ? "line-through text-muted" : ""}`}>{task.title}</p>
      <p className="text-[11px] text-muted mt-1 truncate">
        {task.client?.name || "ohne Mandant"} · {task.assignee?.name || "unzugewiesen"}
      </p>
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <Badge tone={PRIORITY_TONES[task.priority]}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
        {overdue ? <Badge tone="red">überfällig</Badge> : task.dueDate ? <Badge tone="gray">{relativeDueDate(task.dueDate)?.label}</Badge> : null}
      </div>
    </div>
  );
}

const PRIORITY_TONES = { LOW: "gray", MEDIUM: "blue", HIGH: "amber", URGENT: "red" };

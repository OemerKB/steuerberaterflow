"use server";

import { revalidatePath } from "next/cache";
import { taskSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { guard, guardPortal } from "@/lib/context";
import { logAudit, createNotification } from "@/lib/audit";
import { canTransitionTask, isTaskOverdue } from "@/lib/workflow";
import { TASK_STATUS_LABELS } from "@/lib/labels";

export async function createTaskAction(prevState, formData) {
  const { user, organization } = await guard("tasks.create");
  const clientId = String(formData.get("clientId") || "") || null;
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
    if (!client) return { error: "Mandant nicht gefunden." };
  }
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const checklist = formData
    .getAll("checklistItems")
    .map(String)
    .map((t) => t.trim())
    .filter(Boolean);

  const parsed = taskSchema.safeParse({
    title: formData.get("title") || "",
    description: formData.get("description") || "",
    clientId,
    assigneeId,
    priority: formData.get("priority") || "MEDIUM",
    status: "OPEN",
    dueDate: formData.get("dueDate") || "",
    tags: String(formData.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
    checklist: checklist.map((text) => ({ text })),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Bitte Eingaben prüfen." };

  const task = await prisma.task.create({
    data: {
      organizationId: organization.id,
      title: parsed.data.title,
      description: parsed.data.description,
      clientId,
      assigneeId,
      creatorId: user.id,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      tags: parsed.data.tags,
      checklist: {
        create: parsed.data.checklist.map((c, i) => ({ text: c.text, position: i })),
      },
    },
  });

  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "task.created",
    entityType: "Task",
    entityId: task.id,
    metadata: { title: task.title },
  });
  if (assigneeId && assigneeId !== user.id) {
    await createNotification({
      organizationId: organization.id,
      userId: assigneeId,
      type: "task",
      title: "Neue Aufgabe zugewiesen",
      body: task.title,
      link: "/tasks?mine=1",
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return { success: "Aufgabe erstellt." };
}

export async function updateTaskStatusAction(formData) {
  const { user, organization } = await guard("tasks.update");
  const taskId = String(formData.get("taskId") || "");
  const status = String(formData.get("status") || "");
  if (!(status in TASK_STATUS_LABELS)) return { error: "Ungültiger Status." };

  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId: organization.id } });
  if (!task) return { error: "Aufgabe nicht gefunden." };
  if (!canTransitionTask(task.status, status)) {
    return { error: `Statuswechsel von „${TASK_STATUS_LABELS[task.status]}" zu „${TASK_STATUS_LABELS[status]}" ist nicht zulässig.` };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "task.status_changed",
    entityType: "Task",
    entityId: taskId,
    metadata: { from: task.status, to: status },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (task.clientId) revalidatePath(`/clients/${task.clientId}`);
  return { success: `Status: ${TASK_STATUS_LABELS[status]}` };
}

export async function updateTaskAction(prevState, formData) {
  const { user, organization } = await guard("tasks.update");
  const taskId = String(formData.get("taskId") || "");
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId: organization.id } });
  if (!task) return { error: "Aufgabe nicht gefunden." };

  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const dueDate = String(formData.get("dueDate") || "");
  const priority = String(formData.get("priority") || task.priority);
  const title = String(formData.get("title") || task.title).trim();
  if (title.length < 3) return { error: "Bitte Titel angeben." };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: String(formData.get("description") ?? task.description),
      assigneeId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "task.updated",
    entityType: "Task",
    entityId: taskId,
  });
  revalidatePath("/tasks");
  if (task.clientId) revalidatePath(`/clients/${task.clientId}/aufgaben`);
  return { success: "Aufgabe gespeichert." };
}

export async function toggleChecklistItemAction(formData) {
  const { user, organization } = await guard("tasks.update");
  const itemId = String(formData.get("itemId") || "");
  const item = await prisma.taskChecklistItem.findUnique({ where: { id: itemId }, include: { task: true } });
  if (!item || item.task.organizationId !== organization.id) return { error: "Element nicht gefunden." };
  await prisma.taskChecklistItem.update({ where: { id: itemId }, data: { done: !item.done } });
  revalidatePath("/tasks");
  return { success: true };
}

/* ------------------------------- Fristen ---------------------------------- */

export async function createDeadlineAction(prevState, formData) {
  const { user, organization } = await guard("deadlines.manage");
  const clientId = String(formData.get("clientId") || "") || null;
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
    if (!client) return { error: "Mandant nicht gefunden." };
  }
  const dueDate = String(formData.get("dueDate") || "");
  const title = String(formData.get("title") || "").trim();
  if (!dueDate) return { error: "Bitte Fälligkeitsdatum angeben." };
  if (title.length < 3) return { error: "Bitte Titel angeben." };

  const deadline = await prisma.deadline.create({
    data: {
      organizationId: organization.id,
      title,
      clientId,
      assigneeId: String(formData.get("assigneeId") || "") || null,
      dueDate: new Date(dueDate),
      priority: formData.get("priority") || "MEDIUM",
      recurrence: formData.get("recurrence") || "NONE",
      reminderDays: Number(formData.get("reminderDays") || 7),
      notes: String(formData.get("notes") || ""),
    },
  });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "deadline.created",
    entityType: "Deadline",
    entityId: deadline.id,
    metadata: { title, dueDate },
  });
  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return { success: "Frist angelegt (bitte Fristen als Kanzlei fachlich prüfen)." };
}

export async function completeDeadlineAction(formData) {
  const { user, organization } = await guard("deadlines.manage");
  const deadlineId = String(formData.get("deadlineId") || "");
  const deadline = await prisma.deadline.findFirst({
    where: { id: deadlineId, organizationId: organization.id },
  });
  if (!deadline) return { error: "Frist nicht gefunden." };

  await prisma.deadline.update({
    where: { id: deadlineId },
    data: { status: "DONE", completedAt: new Date() },
  });

  // Wiederkehrende Frist: Folgefrist als rechnerische Vorlage anlegen
  let followUpCreated = false;
  if (deadline.recurrence !== "NONE") {
    const { nextRecurrenceDate } = await import("@/lib/workflow");
    const next = nextRecurrenceDate(deadline.dueDate, deadline.recurrence);
    if (next) {
      await prisma.deadline.create({
        data: {
          organizationId: organization.id,
          title: deadline.title,
          clientId: deadline.clientId,
          assigneeId: deadline.assigneeId,
          dueDate: next,
          priority: deadline.priority,
          recurrence: deadline.recurrence,
          reminderDays: deadline.reminderDays,
          notes: deadline.notes,
        },
      });
      followUpCreated = true;
    }
  }

  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "deadline.completed",
    entityType: "Deadline",
    entityId: deadlineId,
    metadata: { followUpCreated },
  });
  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
  return {
    success: followUpCreated ? "Frist erledigt – Folgefrist angelegt (Vorlage, fachlich prüfen)." : "Frist erledigt.",
  };
}

export async function snoozeDeadlineAction(formData) {
  const { user, organization } = await guard("deadlines.manage");
  const deadlineId = String(formData.get("deadlineId") || "");
  const days = Number(formData.get("days") || 7);
  const deadline = await prisma.deadline.findFirst({
    where: { id: deadlineId, organizationId: organization.id },
  });
  if (!deadline) return { error: "Frist nicht gefunden." };
  const dueDate = new Date(deadline.dueDate);
  dueDate.setDate(dueDate.getDate() + days);
  await prisma.deadline.update({ where: { id: deadlineId }, data: { dueDate } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "deadline.postponed",
    entityType: "Deadline",
    entityId: deadlineId,
    metadata: { newDueDate: dueDate.toISOString() },
  });
  revalidatePath("/deadlines");
  return { success: "Frist verschoben." };
}

/** Portal: Aufgaben des Mandanten (nur lesend + Status „erledigt" markieren für Mandantenaufgaben). */
export async function portalTaskDoneAction(formData) {
  const { client } = await guardPortal("portal.tasks.read");
  const taskId = String(formData.get("taskId") || "");
  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId: client.organizationId, clientId: client.id },
  });
  if (!task) return { error: "Aufgabe nicht gefunden." };
  if (task.status !== "WAITING_CLIENT") return { error: "Diese Aufgabe wartet nicht auf den Mandanten." };
  await prisma.task.update({ where: { id: taskId }, data: { status: "WAITING_FIRM" } });
  await logAudit({
    organizationId: client.organizationId,
    actorName: client.name,
    action: "task.client_replied",
    entityType: "Task",
    entityId: taskId,
  });
  revalidatePath("/portal");
  revalidatePath("/portal/tasks");
  return { success: "Danke – die Kanzlei wurde informiert." };
}

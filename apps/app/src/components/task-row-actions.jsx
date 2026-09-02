"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTaskStatusAction, completeDeadlineAction } from "@/actions/tasks";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { canTransitionTask } from "@/lib/workflow";

/** Inline-Statuswechsel für Aufgaben (nur zulässige Übergänge). */
export function TaskRowActions({ taskId, currentStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const options = TASK_STATUS_LIST.filter((s) => s !== currentStatus && canTransitionTask(currentStatus, s));

  if (options.length === 0) return null;
  return (
    <select
      aria-label="Aufgabenstatus ändern"
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value;
        if (!status) return;
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
      }}
      className="h-8 rounded-lg border border-border bg-card px-2 text-xs cursor-pointer"
    >
      <option value="">Status…</option>
      {options.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
    </select>
  );
}

const TASK_STATUS_LIST = Object.keys(TASK_STATUS_LABELS);

/** Frist erledigen (mit Wiederholungslogik). */
export function CompleteDeadlineButton({ deadlineId, label = "Erledigt" }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="h-8 px-2.5 rounded-lg border border-border bg-card text-xs font-medium hover:bg-accent/50 cursor-pointer"
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("deadlineId", deadlineId);
          const res = await completeDeadlineAction(formData);
          if (res?.error) toast.error(res.error);
          else if (res?.success) {
            toast.success(res.success);
            router.refresh();
          }
        })
      }
    >
      {pending ? "…" : label}
    </button>
  );
}

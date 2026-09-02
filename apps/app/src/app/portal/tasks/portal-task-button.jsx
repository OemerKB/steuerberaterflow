"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { portalTaskDoneAction } from "@/actions/tasks";
import { Button } from "@steuerberaterflow/ui";

export function PortalTaskReplyButton({ taskId }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("taskId", taskId);
          const res = await portalTaskDoneAction(formData);
          if (res?.error) toast.error(res.error);
          else if (res?.success) {
            toast.success(res.success);
            router.refresh();
          }
        })
      }
    >
      {pending ? "…" : "Erledigt"}
    </Button>
  );
}

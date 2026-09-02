"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea, Button, Label } from "@steuerberaterflow/ui";
import { decideApprovalAction } from "@/actions/workflow-extra";

export function ApprovalDecisionForm({ requestId }) {
  const [state, formAction, pending] = useActionState(decideApprovalAction, {});
  const router = useRouter();
  const formRef = useRef(null);
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-3 space-y-2 border-t border-border pt-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <Label htmlFor={`dec-${requestId}`}>Kommentar (optional)</Label>
        <Textarea id={`dec-${requestId}`} name="comment" rows={2} placeholder="Anmerkung zur Prüfung…" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="APPROVED" size="sm" disabled={pending}>Freigeben</Button>
        <Button type="submit" name="decision" value="CHANGES" variant="secondary" size="sm" disabled={pending}>Änderung anfordern</Button>
        <Button type="submit" name="decision" value="REJECTED" variant="ghost" size="sm" className="text-danger" disabled={pending}>Ablehnen</Button>
      </div>
    </form>
  );
}

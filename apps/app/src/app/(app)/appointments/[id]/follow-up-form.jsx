"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Label, Textarea } from "@steuerberaterflow/ui";
import { saveAppointmentFollowUpAction } from "@/actions/workflow-extra";

export function FollowUpForm({ appointmentId, notes, followUp, canEdit }) {
  const [state, formAction, pending] = useActionState(saveAppointmentFollowUpAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <fieldset disabled={!canEdit} className="space-y-3">
        <div>
          <Label htmlFor="fu-notes">Besprechungsnotizen</Label>
          <Textarea id="fu-notes" name="notes" rows={4} defaultValue={notes} placeholder="Notizen aus dem Gespräch…" />
        </div>
        <div>
          <Label htmlFor="fu-followup">Nachbereitungsaufgaben</Label>
          <Textarea id="fu-followup" name="followUp" rows={3} defaultValue={followUp} placeholder="z. B. BWA an Mandant senden; Belege August anfordern…" />
        </div>
      </fieldset>
      {canEdit ? (
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Speichern…" : "Speichern"}</Button>
        </div>
      ) : null}
    </form>
  );
}

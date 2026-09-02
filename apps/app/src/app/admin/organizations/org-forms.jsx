"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Input, Label, Textarea, FieldError } from "@steuerberaterflow/ui";
import { adminToggleOrgStatusAction, adminCreateSupportCaseAction, adminToggleFeatureFlagAction } from "@/actions/admin";
import { Pause, Play, Wrench, ToggleLeft } from "lucide-react";

export function OrgSuspendForm({ organizationId, suspended }) {
  const [state, formAction, pending] = useActionState(adminToggleOrgStatusAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          {suspended ? <><Play className="h-3.5 w-3.5" /> Aktivieren</> : <><Pause className="h-3.5 w-3.5" /> Sperren</>}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={suspended ? "Kanzlei aktivieren" : "Kanzlei sperren"}
        description="Diese Aktion wird im Audit-Protokoll festgehalten."
      >
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="action" value={suspended ? "ACTIVATE" : "SUSPEND"} />
          <div>
            <Label htmlFor="sp-reason">Begründung</Label>
            <Textarea id="sp-reason" name="reason" rows={2} placeholder="Optional: Grund der Maßnahme" />
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end">
            <Button type="submit" variant={suspended ? "primary" : "danger"} disabled={pending}>
              {pending ? "…" : suspended ? "Aktivieren" : "Sperren"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewSupportCaseForm({ organizations }) {
  const [state, formAction, pending] = useActionState(adminCreateSupportCaseAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="sc-subject">Betreff *</Label>
        <Input id="sc-subject" name="subject" required minLength={3} />
      </div>
      <div>
        <Label htmlFor="sc-org">Kanzlei (optional)</Label>
        <select id="sc-org" name="organizationId" className="h-9 w-full rounded-lg border border-border px-2 text-sm bg-card">
          <option value="">– plattformweit –</option>
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="sc-message">Beschreibung</Label>
        <Textarea id="sc-message" name="message" rows={2} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        <Wrench className="h-3.5 w-3.5" /> {pending ? "…" : "Supportfall erstellen"}
      </Button>
      {state?.error ? <p className="text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}

export function FeatureFlagToggle({ flag }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("flagId", flag.id);
          const res = await adminToggleFeatureFlagAction(formData);
          if (res?.error) toast.error(res.error);
          else if (res?.success) {
            toast.success(res.success);
            router.refresh();
          }
        })
      }
    >
      <ToggleLeft className="h-3.5 w-3.5" /> {flag.enabled ? "Deaktivieren" : "Aktivieren"}
    </Button>
  );
}

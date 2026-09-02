"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Label, NativeSelect, Button } from "@steuerberaterflow/ui";
import { inviteTeamMemberAction, updateMemberRoleAction, deactivateMemberAction } from "@/actions/settings";
import { ROLE_LABELS } from "@/lib/labels";

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteTeamMemberAction, {});
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
        <Label htmlFor="tm-name">Name *</Label>
        <Input id="tm-name" name="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="tm-email">E-Mail *</Label>
        <Input id="tm-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="tm-role">Rolle</Label>
        <NativeSelect id="tm-role" name="role" defaultValue="STAFF">
          <option value="STAFF">{ROLE_LABELS.STAFF}</option>
          <option value="ACCOUNTANT">{ROLE_LABELS.ACCOUNTANT}</option>
        </NativeSelect>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Wird eingeladen…" : "Einladung senden"}
      </Button>
      {state?.error ? <p className="text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}

export function RoleSelect({ membershipId, currentRole }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="flex items-center gap-1.5">
      <NativeSelect
        aria-label="Rolle ändern"
        defaultValue={currentRole}
        disabled={pending}
        className="h-8 text-xs w-40"
        onChange={(e) => {
          const formData = new FormData();
          formData.set("membershipId", membershipId);
          formData.set("role", e.target.value);
          startTransition(async () => {
            const res = await updateMemberRoleAction(formData);
            if (res?.error) toast.error(res.error);
            else if (res?.success) {
              toast.success(res.success);
              router.refresh();
            }
          });
        }}
      >
        {Object.entries(ROLE_LABELS).filter(([k]) => k !== "CLIENT").map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </NativeSelect>
      <button
        type="button"
        aria-label="Mitglied entfernen"
        className="text-[11px] text-danger hover:underline cursor-pointer"
        onClick={() => {
          const formData = new FormData();
          formData.set("membershipId", membershipId);
          startTransition(async () => {
            const res = await deactivateMemberAction(formData);
            if (res?.error) toast.error(res.error);
            else if (res?.success) {
              toast.success(res.success);
              router.refresh();
            }
          });
        }}
      >
        Entfernen
      </button>
    </div>
  );
}

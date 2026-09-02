"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Label, Button } from "@steuerberaterflow/ui";
import { updateProfileAction, changePasswordAction } from "@/actions/auth";

export function ProfileForm({ user }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {});
  const [pwState, pwFormAction, pwPending] = useActionState(changePasswordAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);
  useEffect(() => {
    if (pwState?.success) {
      toast.success(pwState.success);
      router.refresh();
    } else if (pwState?.error) toast.error(pwState.error);
  }, [pwState]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="pf-name">Name</Label>
          <Input id="pf-name" name="name" defaultValue={user.name} required minLength={2} />
        </div>
        <div>
          <Label htmlFor="pf-email">E-Mail (nicht änderbar)</Label>
          <Input id="pf-email" defaultValue={user.email} disabled />
        </div>
        <div>
          <Label htmlFor="pf-tz">Zeitzone</Label>
          <select id="pf-tz" name="timezone" defaultValue="Europe/Berlin" className="h-9 w-full rounded-lg border border-border px-3 text-sm">
            <option value="Europe/Berlin">Europa/Berlin</option>
            <option value="Europe/Vienna">Europa/Wien</option>
            <option value="Europe/Zurich">Europa/Zürich</option>
          </select>
        </div>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Speichern…" : "Profil speichern"}</Button>
      </form>

      <form action={pwFormAction} className="space-y-3 border-t border-border pt-5">
        <p className="text-sm font-semibold">Passwort ändern</p>
        <div>
          <Label htmlFor="pf-current">Aktuelles Passwort</Label>
          <Input id="pf-current" name="currentPassword" type="password" autoComplete="current-password" required />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pf-new">Neues Passwort (min. 10 Zeichen)</Label>
            <Input id="pf-new" name="newPassword" type="password" autoComplete="new-password" required minLength={10} />
          </div>
          <div>
            <Label htmlFor="pf-confirm">Wiederholen</Label>
            <Input id="pf-confirm" name="passwordConfirm" type="password" autoComplete="new-password" required minLength={10} />
          </div>
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={pwPending}>{pwPending ? "Aktualisieren…" : "Passwort ändern"}</Button>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { acceptInvitationAction } from "@/actions/auth";
import { Input, Label, Button, FieldError } from "@steuerberaterflow/ui";

export function AcceptInviteForm({ token, initialName }) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="name">Ihr Name</Label>
        <Input id="name" name="name" defaultValue={initialName} required minLength={2} />
      </div>
      <div>
        <Label htmlFor="password">Passwort (min. 10 Zeichen)</Label>
        <Input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" />
      </div>
      <div>
        <Label htmlFor="passwordConfirm">Passwort wiederholen</Label>
        <Input id="passwordConfirm" name="passwordConfirm" type="password" required minLength={10} autoComplete="new-password" />
      </div>
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Wird eingerichtet…" : "Konto einrichten"}
      </Button>
    </form>
  );
}

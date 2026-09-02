"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Input, Label, Button, FieldError } from "@steuerberaterflow/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="name@kanzlei.de" />
      </div>
      <div>
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••••" />
      </div>
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Anmeldung…" : "Anmelden"}
      </Button>
    </form>
  );
}

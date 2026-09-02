"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addClientContactAction, addClientNoteAction } from "@/actions/clients";
import {
  Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Checkbox, FieldHint,
} from "@steuerberaterflow/ui";

export function AddContactForm({ clientId }) {
  const [state, formAction, pending] = useActionState(addClientContactAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ct-name">Name *</Label>
          <Input id="ct-name" name="name" required minLength={2} />
        </div>
        <div>
          <Label htmlFor="ct-role">Funktion</Label>
          <Input id="ct-role" name="role" placeholder="z. B. Geschäftsführerin" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ct-email">E-Mail</Label>
          <Input id="ct-email" name="email" type="email" />
        </div>
        <div>
          <Label htmlFor="ct-phone">Telefon</Label>
          <Input id="ct-phone" name="phone" />
        </div>
      </div>
      <Checkbox name="isPrimary" label="Primärer Ansprechpartner" />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Hinzufügen"}</Button>
      </div>
    </form>
  );
}

export function AddNoteForm({ clientId }) {
  const [state, formAction, pending] = useActionState(addClientNoteAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <textarea
        name="content"
        required
        minLength={3}
        rows={3}
        placeholder="Notiz für die Kanzlei (interner Kontext)…"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
      />
      <FieldHint>Notizen sind intern und für Mandanten nicht sichtbar.</FieldHint>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Notiz hinzufügen"}</Button>
      </div>
    </form>
  );
}

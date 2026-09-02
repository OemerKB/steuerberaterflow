"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Input, Label, Textarea, NativeSelect, Checkbox, FieldError, FieldHint } from "@steuerberaterflow/ui";
import { Plus } from "lucide-react";
import { startConversationAction } from "@/actions/messages";

/** Dialog: Nachricht senden (Mandant) oder interne Kanzleinotiz. */
export function NewMessageDialog({ clients = [], defaultClientId = null, trigger, allowInternal = true }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(startConversationAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      if (state.conversationId) router.push(`/messages/${state.conversationId}`);
      else router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Nachricht</Button>
        )}
      </DialogTrigger>
      <DialogContent title="Neue Nachricht" description="Sichere Nachricht an einen Mandanten – oder interne Kanzleinotiz.">
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="msg-client">Mandant *</Label>
            <NativeSelect id="msg-client" name="clientId" required defaultValue={defaultClientId || ""}>
              <option value="">– bitte wählen –</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="msg-subject">Betreff *</Label>
            <Input id="msg-subject" name="subject" required minLength={3} />
          </div>
          <div>
            <Label htmlFor="msg-content">Nachricht *</Label>
            <Textarea id="msg-content" name="content" required rows={4} />
          </div>
          {allowInternal ? (
            <div>
              <Checkbox name="isInternal" label="Als interne Kanzleinotiz erstellen (niemals für Mandanten sichtbar)" />
              <FieldHint>Interne Notizen erscheinen nur für Kanzleimitarbeiter.</FieldHint>
            </div>
          ) : null}
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending}>{pending ? "Senden…" : "Senden"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

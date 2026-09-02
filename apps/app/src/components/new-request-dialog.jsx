"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Input, Label, NativeSelect, FieldError, FieldHint } from "@steuerberaterflow/ui";
import { Plus } from "lucide-react";
import { createRequestAction } from "@/actions/requests";

const DEFAULT_ITEMS = [
  "Kontoauszug Geschäftskonto",
  "Kreditkartenabrechnung",
  "Kassenbericht",
  "Eingangsrechnungen",
  "Ausgangsrechnungen",
  "Bewirtungsbelege",
];

/** Dialog: Unterlagenpaket anfordern („Monatsbuchhaltung August 2026"). */
export function NewRequestDialog({ clients = [], defaultClientId = null, trigger }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createRequestAction, {});
  const router = useRouter();
  const [items, setItems] = useState([...DEFAULT_ITEMS]);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      setItems([...DEFAULT_ITEMS]);
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Unterlagen anfordern</Button>
        )}
      </DialogTrigger>
      <DialogContent title="Fehlende Unterlagen anfordern" description="Erstellen Sie ein Unterlagenpaket, z. B. „Monatsbuchhaltung August 2026“.">
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="req-client">Mandant *</Label>
            <NativeSelect id="req-client" name="clientId" required defaultValue={defaultClientId || ""}>
              <option value="">– bitte wählen –</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="req-title">Titel *</Label>
            <Input id="req-title" name="title" required minLength={3} placeholder="Monatsbuchhaltung August 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="req-period">Zeitraum</Label>
              <Input id="req-period" name="periodLabel" placeholder="08 / 2026" />
            </div>
            <div>
              <Label htmlFor="req-due">Fälligkeit</Label>
              <Input id="req-due" name="dueDate" type="date" />
            </div>
          </div>
          <div>
            <Label htmlFor="req-desc">Nachricht an Mandant</Label>
            <Input id="req-desc" name="description" placeholder="Optional: kurze Erläuterung" />
          </div>
          <div>
            <Label>Benötigte Unterlagen *</Label>
            <FieldHint>Eintrag mit leerem Text wird ignoriert.</FieldHint>
            <div className="mt-1.5 space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    name="itemTitles"
                    value={item}
                    placeholder={`Unterlage ${i + 1}`}
                    onChange={(e) => setItems(items.map((it, idx) => (idx === i ? e.target.value : it)))}
                  />
                  <Input name="itemDueDates" type="date" className="w-36" />
                  <Button type="button" variant="ghost" size="icon" aria-label="Unterlage entfernen" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>×</Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => setItems([...items, ""])}>
                + Unterlage
              </Button>
            </div>
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending}>{pending ? "Erstellen…" : "Unterlagen anfordern"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

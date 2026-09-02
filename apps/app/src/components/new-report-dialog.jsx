"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Label, Input, Textarea, NativeSelect, FieldError, FieldHint } from "@steuerberaterflow/ui";
import { Plus } from "lucide-react";
import { createReportNoteAction } from "@/actions/workflow-extra";

/** Dialog: Verständliche Kanzlei-Notiz/Auswertung für Mandanten veröffentlichen. */
export function NewReportDialog({ clients, trigger }) {
  const [state, formAction, pending] = useActionState(createReportNoteAction, {});
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
        {trigger || <Button size="sm"><Plus className="h-3.5 w-3.5" /> Auswertung/Notiz</Button>}
      </DialogTrigger>
      <DialogContent
        title="Auswertung oder Hinweis veröffentlichen"
        description="Verständliche Kanzlei-Notiz, z. B. zu einer BWA oder einem Steuerbescheid."
      >
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="rp-client">Mandant *</Label>
            <NativeSelect id="rp-client" name="clientId" required defaultValue="">
              <option value="">– bitte wählen –</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="rp-title">Titel *</Label>
            <Input id="rp-title" name="title" required minLength={3} placeholder="z. B. Ihre BWA August 2026 – kurz erklärt" />
          </div>
          <div>
            <Label htmlFor="rp-period">Zeitraum</Label>
            <Input id="rp-period" name="periodLabel" placeholder="08 / 2026" />
          </div>
          <div>
            <Label htmlFor="rp-content">Inhalt *</Label>
            <Textarea id="rp-content" name="content" required rows={5} minLength={3} placeholder="Verständliche Zusammenfassung für den Mandanten…" />
            <FieldHint>Keine steuerlichen Berechnungen erfinden – Inhalte fachlich prüfen.</FieldHint>
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Veröffentlichen…" : "Veröffentlichen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

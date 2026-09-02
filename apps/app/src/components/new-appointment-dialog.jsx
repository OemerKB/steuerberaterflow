"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Input, Label, Textarea, NativeSelect, FieldError } from "@steuerberaterflow/ui";
import { Plus } from "lucide-react";
import { createAppointmentAction } from "@/actions/workflow-extra";
import { APPOINTMENT_TYPE_LABELS } from "@/lib/labels";

/** Dialog: Termin planen (mit Demo-/Provider-Meetingraum). */
export function NewAppointmentDialog({ clients = [], staff = [], defaultClientId = null, trigger }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAppointmentAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Termin</Button>
        )}
      </DialogTrigger>
      <DialogContent title="Termin planen" description="Termin mit Meetingraum anlegen – Mandant wird benachrichtigt.">
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="apt-client">Mandant *</Label>
            <NativeSelect id="apt-client" name="clientId" required defaultValue={defaultClientId || ""}>
              <option value="">– bitte wählen –</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="apt-title">Titel *</Label>
            <Input id="apt-title" name="title" required minLength={3} placeholder="z. B. BWA-Besprechung Q2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="apt-type">Terminart</Label>
              <NativeSelect id="apt-type" name="type" defaultValue="GENERAL">
                {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="apt-duration">Dauer (Min.)</Label>
              <NativeSelect id="apt-duration" name="durationMinutes" defaultValue="30">
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="apt-start">Start *</Label>
              <Input id="apt-start" name="startsAt" type="datetime-local" required />
            </div>
            <div>
              <Label htmlFor="apt-consultant">Berater</Label>
              <NativeSelect id="apt-consultant" name="consultantId" defaultValue="">
                <option value="">– mir selbst –</option>
                {staff.map((s) => <option key={s.id} value={s.userId}>{s.user?.name || s.name}</option>)}
              </NativeSelect>
            </div>
          </div>
          <div>
            <Label htmlFor="apt-notes">Notizen</Label>
            <Textarea id="apt-notes" name="notes" rows={2} />
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Termin anlegen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

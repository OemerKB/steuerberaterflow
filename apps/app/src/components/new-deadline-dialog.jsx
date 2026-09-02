"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Label, Input, Textarea, NativeSelect, FieldError } from "@steuerberaterflow/ui";
import { Plus } from "lucide-react";
import { createDeadlineAction } from "@/actions/tasks";

export function NewDeadlineDialog({ clients = [], staff = [], trigger }) {
  const [state, formAction, pending] = useActionState(createDeadlineAction, {});
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
        {trigger || <Button size="sm"><Plus className="h-3.5 w-3.5" /> Frist</Button>}
      </DialogTrigger>
      <DialogContent
        title="Frist anlegen"
        description="Manuelle oder wiederkehrende Frist. Hinweis: rechnerische Vorlage – fachlich durch die Kanzlei prüfen."
      >
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="dl-title">Titel *</Label>
            <Input id="dl-title" name="title" required minLength={3} placeholder="z. B. Umsatzsteuervoranmeldung einreichen" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dl-client">Mandant</Label>
              <NativeSelect id="dl-client" name="clientId" defaultValue="">
                <option value="">– ohne Mandant –</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="dl-assignee">Verantwortlich</Label>
              <NativeSelect id="dl-assignee" name="assigneeId" defaultValue="">
                <option value="">– mir selbst –</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dl-due">Fälligkeit *</Label>
              <Input id="dl-due" name="dueDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="dl-priority">Priorität</Label>
              <NativeSelect id="dl-priority" name="priority" defaultValue="MEDIUM">
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dl-recurrence">Wiederholung</Label>
              <NativeSelect id="dl-recurrence" name="recurrence" defaultValue="NONE">
                <option value="NONE">Einmalig</option>
                <option value="MONTHLY">Monatlich</option>
                <option value="QUARTERLY">Quartalsweise</option>
                <option value="YEARLY">Jährlich</option>
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="dl-reminder">Erinnerung (Tage vorher)</Label>
              <Input id="dl-reminder" name="reminderDays" type="number" min="0" max="90" defaultValue="7" />
            </div>
          </div>
          <div>
            <Label htmlFor="dl-notes">Notizen</Label>
            <Textarea id="dl-notes" name="notes" rows={2} />
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Frist anlegen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

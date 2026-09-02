"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Input, Label, Textarea, NativeSelect, FieldError } from "@steuerberaterflow/ui";
import { Plus } from "lucide-react";
import { createTaskAction } from "@/actions/tasks";

/**
 * Dialog: Neue Aufgabe (Dashboard, Aufgabenliste, Mandantenakte).
 */
export function NewTaskDialog({ clients = [], staff = [], defaultClientId = null, trigger }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createTaskAction, {});
  const router = useRouter();
  const [checklist, setChecklist] = useState([""]);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      setChecklist([""]);
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Aufgabe</Button>
        )}
      </DialogTrigger>
      <DialogContent title="Neue Aufgabe" description="Aufgabe für Kanzlei, Mitarbeiter oder Mandanten anlegen.">
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="task-title">Titel *</Label>
            <Input id="task-title" name="title" required minLength={3} placeholder="z. B. Belege August prüfen" />
          </div>
          <div>
            <Label htmlFor="task-desc">Beschreibung</Label>
            <Textarea id="task-desc" name="description" rows={2} placeholder="Kontext, Links, Hinweise…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="task-client">Mandant</Label>
              <NativeSelect id="task-client" name="clientId" defaultValue={defaultClientId || ""}>
                <option value="">– ohne Mandant –</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="task-assignee">Verantwortlich</Label>
              <NativeSelect id="task-assignee" name="assigneeId" defaultValue="">
                <option value="">– mir selbst –</option>
                {staff.map((s) => <option key={s.id} value={s.userId}>{s.user?.name || s.name}</option>)}
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="task-priority">Priorität</Label>
              <NativeSelect id="task-priority" name="priority" defaultValue="MEDIUM">
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="task-due">Fälligkeit</Label>
              <Input id="task-due" name="dueDate" type="date" />
            </div>
            <div>
              <Label htmlFor="task-tags">Tags</Label>
              <Input id="task-tags" name="tags" placeholder="bwa, august" />
            </div>
          </div>
          <div>
            <Label>Checkliste</Label>
            <div className="space-y-1.5">
              {checklist.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    name="checklistItems"
                    value={item}
                    placeholder={`Punkt ${i + 1}`}
                    onChange={(e) => setChecklist(checklist.map((c, idx) => (idx === i ? e.target.value : c)))}
                  />
                  {checklist.length > 1 ? (
                    <Button type="button" variant="ghost" size="icon" aria-label="Punkt entfernen" onClick={() => setChecklist(checklist.filter((_, idx) => idx !== i))}>×</Button>
                  ) : null}
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => setChecklist([...checklist, ""])}>
                + Punkt hinzufügen
              </Button>
            </div>
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Aufgabe erstellen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Label, NativeSelect, Textarea, FieldError } from "@steuerberaterflow/ui";
import { portalBookAppointmentAction } from "@/actions/workflow-extra";
import { APPOINTMENT_TYPE_LABELS } from "@/lib/labels";

/** Erzeugt freie 30-Minuten-Slots für die nächsten 14 Werktage (9–12, 14–17 Uhr). */
function generateSlots() {
  const slots = [];
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let d = 1; d <= 14; d++) {
    const day = new Date(base);
    day.setDate(base.getDate() + d);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const hour of [9, 10, 11, 14, 15, 16]) {
      for (const minute of [0, 30]) {
        const slot = new Date(day);
        slot.setHours(hour, minute, 0, 0);
        if (slot > now) slots.push(slot);
      }
    }
  }
  return slots.slice(0, 40);
}

export function SlotPicker() {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [state, formAction, pending] = useActionState(portalBookAppointmentAction, {});
  const router = useRouter();

  useEffect(() => {
    setSlots(generateSlots());
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setSelected(null);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="bk-type">Beratungsart</Label>
        <NativeSelect id="bk-type" name="type" defaultValue="FOLLOW_UP">
          {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </NativeSelect>
      </div>
      <div>
        <Label>Verfügbare Zeitfenster</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mt-1.5 max-h-64 overflow-y-auto sf-scroll p-1">
          {slots.map((slot) => {
            const id = `slot-${slot.getTime()}-GENERAL`;
            const label = `${new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(slot)} ${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(slot)} · ${new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(slot)}`;
            const active = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={`rounded-md border px-1.5 py-1.5 text-[10px] leading-tight cursor-pointer transition-colors ${
                  active ? "border-primary bg-accent text-accent-foreground font-semibold" : "border-border hover:border-primary/50 text-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="slotId" value={selected || ""} />
      </div>
      <div>
        <Label htmlFor="bk-note">Anmerkung (optional)</Label>
        <Textarea id="bk-note" name="note" rows={2} placeholder="Worum geht es?" />
      </div>
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" disabled={!selected || pending}>
        {pending ? "Wird gebucht…" : selected ? "Termin anfragen" : "Bitte Zeitfenster wählen"}
      </Button>
    </form>
  );
}

import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState, Button } from "@steuerberaterflow/ui";
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, formatDateTime } from "@/lib/labels";
import { SlotPicker } from "./slot-picker";
import Link from "next/link";

export const metadata = { title: "Termine" };

export default async function PortalAppointmentsPage() {
  const { client } = await requireClientContext();

  const appointments = await prisma.appointment.findMany({
    where: { organizationId: client.organizationId, clientId: client.id },
    include: { meetingRoom: true, consultant: { select: { name: true } } },
    orderBy: { startsAt: "desc" },
  });
  const upcoming = appointments.filter((a) => new Date(a.startsAt) >= new Date() && a.status !== "CANCELLED").reverse();
  const past = appointments.filter((a) => new Date(a.startsAt) < new Date() || a.status === "CANCELLED");

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Termin buchen</CardTitle>
          <p className="text-xs text-muted mt-1">Wählen Sie eine Beratungsart und ein freies Zeitfenster in den nächsten 14 Tagen.</p>
        </CardHeader>
        <CardContent>
          <SlotPicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Meine Termine ({upcoming.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <EmptyState title="Keine Termine" description="Buchen Sie oben Ihren nächsten Beratungstermin." />
          ) : (
            upcoming.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(a.startsAt)} · {a.durationMinutes} Min.
                    {a.consultant?.name ? ` · ${a.consultant.name}` : ""}
                  </p>
                </div>
                <Badge tone={a.status === "CONFIRMED" ? "green" : "amber"}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
                {a.meetingRoom ? <Link href="/portal/appointments" className="text-xs sf-link">Meetingraum</Link> : null}
              </div>
            ))
          )}
          <p className="text-[10px] text-muted/80 border-t border-border/60 pt-2">
            Bei gebuchten Terminen erhalten Sie einen Meetingraum-Link. Videofunktionen sind im
            Demo-Modus simuliert.
          </p>
        </CardContent>
      </Card>

      {past.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Vergangene Termine</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {past.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 opacity-75">
                <div>
                  <p className="text-sm truncate">{a.title}</p>
                  <p className="text-xs text-muted">{formatDateTime(a.startsAt)}</p>
                </div>
                <Badge tone="gray">{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, formatDateTime, formatDate } from "@/lib/labels";
import { videoProvider } from "@/lib/adapters/video";

export const metadata = { title: "Termine" };

export default async function AppointmentsPage() {
  const { role, organization } = await requireFirmContext();

  const appointments = await prisma.appointment.findMany({
    where: { organizationId: organization.id },
    include: { client: { select: { id: true, name: true } }, consultant: { select: { name: true } }, meetingRoom: true },
    orderBy: { startsAt: "desc" },
  });

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.startsAt) >= now && a.status !== "CANCELLED");
  const past = appointments.filter((a) => new Date(a.startsAt) < now || a.status === "CANCELLED");

  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Termine"
        description={
          videoProvider === "demo"
            ? "Terminverwaltung mit Demo-Meetingräumen (Video-Provider nicht konfiguriert)."
            : "Terminverwaltung mit integrierter Video-Beratung."
        }
        actions={can(role, "appointments.manage") ? <NewAppointmentDialog clients={clients} staff={staff} /> : null}
      />

      <Card>
        <CardHeader><CardTitle>Anstehende Termine ({upcoming.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <EmptyState title="Keine anstehenden Termine" description="Planen Sie Beratungstermine mit Meetingraum." />
          ) : (
            upcoming.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted">
                    <Link href={`/clients/${a.client.id}`} className="hover:text-primary">{a.client.name}</Link>
                    {" · "}{formatDateTime(a.startsAt)} · {a.durationMinutes} Min.
                    {a.consultant?.name ? ` · ${a.consultant.name}` : ""}
                  </p>
                </div>
                <Badge tone="gray">{APPOINTMENT_TYPE_LABELS[a.type]}</Badge>
                <Badge tone={a.status === "CONFIRMED" ? "green" : "amber"}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
                {a.meetingRoom ? (
                  <Link href={`/appointments/${a.id}`} className="text-xs font-medium h-8 px-3 inline-flex items-center rounded-lg bg-primary text-white hover:bg-primary-hover">
                    Meeting starten
                  </Link>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vergangene &amp; abgesagte Termine</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {past.length === 0 ? (
            <p className="text-xs text-muted text-center py-2">Keine Einträge.</p>
          ) : (
            past.slice(0, 10).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 px-3 py-2 opacity-80">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{a.title}</p>
                  <p className="text-xs text-muted">{a.client.name} · {formatDate(a.startsAt)}</p>
                </div>
                <Badge tone={a.status === "CANCELLED" ? "red" : "gray"}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

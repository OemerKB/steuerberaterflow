import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, formatDateTime } from "@/lib/labels";

export const metadata = { title: "Termine der Akte" };

export default async function ClientAppointmentsPage({ params }) {
  const { clientId } = await params;
  const { role, organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const appointments = await prisma.appointment.findMany({
    where: { organizationId: organization.id, clientId },
    include: { consultant: { select: { name: true } }, meetingRoom: true },
    orderBy: { startsAt: "desc" },
  });
  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>Termine ({appointments.length})</CardTitle>
        {can(role, "appointments.manage") ? (
          <NewAppointmentDialog clients={[{ id: client.id, name: client.name }]} staff={staff} defaultClientId={client.id} />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {appointments.length === 0 ? (
          <EmptyState title="Keine Termine" description="Planen Sie den nächsten Beratungstermin." />
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted">
                  {formatDateTime(a.startsAt)} · {a.durationMinutes} Min.
                  {a.consultant?.name ? ` · ${a.consultant.name}` : ""}
                </p>
              </div>
              <Badge tone="gray">{APPOINTMENT_TYPE_LABELS[a.type]}</Badge>
              <Badge tone={a.status === "CONFIRMED" ? "green" : a.status === "CANCELLED" ? "red" : "amber"}>
                {APPOINTMENT_STATUS_LABELS[a.status]}
              </Badge>
              {a.meetingRoom ? (
                <Link href={`/appointments/${a.id}`} className="text-xs sf-link">Meetingraum</Link>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@steuerberaterflow/ui";
import { MeetingRoom } from "./meeting-room";
import { FollowUpForm } from "./follow-up-form";
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, formatDateTime } from "@/lib/labels";

export const metadata = { title: "Meetingraum" };

export default async function AppointmentDetailPage({ params }) {
  const { id } = await params;
  const { user, role, organization } = await requireFirmContext();

  const appointment = await prisma.appointment.findFirst({
    where: { id, organizationId: organization.id },
    include: {
      client: { select: { id: true, name: true } },
      consultant: { select: { name: true } },
      meetingRoom: true,
    },
  });
  if (!appointment) notFound();

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight">{appointment.title}</h1>
          <Badge tone={appointment.status === "CONFIRMED" ? "green" : "gray"}>{APPOINTMENT_STATUS_LABELS[appointment.status]}</Badge>
        </div>
        <p className="text-sm text-muted mt-0.5">
          {APPOINTMENT_TYPE_LABELS[appointment.type]} · <Link href={`/clients/${appointment.client.id}`} className="sf-link">{appointment.client.name}</Link> · {formatDateTime(appointment.startsAt)} ({appointment.durationMinutes} Min.)
          {appointment.consultant?.name ? ` · ${appointment.consultant.name}` : ""}
        </p>
      </div>

      {appointment.meetingRoom ? (
        <Card>
          <CardHeader>
            <CardTitle>Beratung mit Video &amp; Bildschirmfreigabe</CardTitle>
            <CardDescription>
              {appointment.meetingRoom.isDemo
                ? "Demo-Meetingraum: Kamera, Mikrofon und Bildschirmfreigabe werden lokal simuliert – es wird keine echte Verbindung aufgebaut. Integration eines Providers (z. B. Daily) ist vorbereitet."
                : "Live-Meetingraum (externer Provider konfiguriert)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MeetingRoom roomName={appointment.meetingRoom.externalId} isDemo={appointment.meetingRoom.isDemo} userName={user.name} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Notizen &amp; Nachbereitung</CardTitle></CardHeader>
        <CardContent>
          <FollowUpForm appointmentId={appointment.id} notes={appointment.notes} followUp={appointment.followUp} canEdit={role !== "ACCOUNTANT"} />
        </CardContent>
      </Card>
    </div>
  );
}

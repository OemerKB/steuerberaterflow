"use server";

import { revalidatePath } from "next/cache";
import { appointmentSchema, approvalRequestSchema, approvalDecisionSchema, appointmentBookingSchema, reportNoteSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { guard, guardPortal } from "@/lib/context";
import { logAudit, createNotification, notifyOrgMembers } from "@/lib/audit";
import { createMeetingRoom, videoProvider } from "@/lib/adapters/video";

/* --------------------------------- Termine --------------------------------- */

export async function createAppointmentAction(prevState, formData) {
  const { user, organization } = await guard("appointments.manage");
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) return { error: "Mandant nicht gefunden." };

  const parsed = appointmentSchema.safeParse({
    clientId,
    type: formData.get("type") || "GENERAL",
    title: formData.get("title") || "",
    startsAt: formData.get("startsAt") || "",
    durationMinutes: Number(formData.get("durationMinutes") || 30),
    consultantId: String(formData.get("consultantId") || "") || null,
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const room = await createMeetingRoom({ organizationId: organization.id, title: parsed.data.title });

  const appointment = await prisma.appointment.create({
    data: {
      organizationId: organization.id,
      clientId,
      type: parsed.data.type,
      title: parsed.data.title,
      startsAt: new Date(parsed.data.startsAt),
      durationMinutes: parsed.data.durationMinutes,
      consultantId: parsed.data.consultantId,
      notes: parsed.data.notes,
      status: "CONFIRMED",
      meetingRoom: { create: { organizationId: organization.id, provider: room.provider, externalId: room.externalId, url: room.url, isDemo: room.isDemo } },
    },
    include: { meetingRoom: true },
  });

  if (client.portalUserId) {
    await createNotification({
      organizationId: organization.id,
      userId: client.portalUserId,
      type: "appointment",
      title: "Neuer Termin",
      body: `${parsed.data.title} – ${new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short" }).format(new Date(parsed.data.startsAt))}`,
      link: "/portal/appointments",
    });
  }
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "appointment.created",
    entityType: "Appointment",
    entityId: appointment.id,
    metadata: { type: parsed.data.type, startsAt: parsed.data.startsAt },
  });
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: "Termin angelegt." };
}

export async function updateAppointmentStatusAction(formData) {
  const { user, organization } = await guard("appointments.manage");
  const appointmentId = String(formData.get("appointmentId") || "");
  const status = String(formData.get("status") || "");
  if (!["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
    return { error: "Ungültiger Status." };
  }
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId: organization.id },
    include: { client: true },
  });
  if (!appointment) return { error: "Termin nicht gefunden." };
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "appointment.status_changed",
    entityType: "Appointment",
    entityId: appointmentId,
    metadata: { status },
  });
  revalidatePath("/appointments");
  return { success: "Terminstatus aktualisiert." };
}

export async function saveAppointmentFollowUpAction(prevState, formData) {
  const { user, organization } = await guard("appointments.manage");
  const appointmentId = String(formData.get("appointmentId") || "");
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId: organization.id },
  });
  if (!appointment) return { error: "Termin nicht gefunden." };
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      notes: String(formData.get("notes") ?? appointment.notes),
      followUp: String(formData.get("followUp") ?? appointment.followUp),
    },
  });
  revalidatePath(`/appointments/${appointmentId}`);
  return { success: "Nachbereitung gespeichert." };
}

/** Portal: Termin buchen aus verfügbaren Zeitfenstern der nächsten 14 Tage. */
export async function portalBookAppointmentAction(prevState, formData) {
  const { user, client } = await guardPortal("portal.appointments.book");
  const parsed = appointmentBookingSchema.safeParse({
    type: formData.get("type") || "GENERAL",
    slotId: formData.get("slotId") || "",
    note: formData.get("note") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // slotId-Format: "slot-<timestamp>-<type>"
  const match = /^slot-(\d+)-([A-Z_]+)$/.exec(parsed.data.slotId);
  if (!match) return { error: "Ungültiges Zeitfenster." };
  const startsAt = new Date(Number(match[1]));
  if (startsAt < new Date()) return { error: "Dieses Zeitfenster liegt in der Vergangenheit." };

  // Kollision mit bestehenden Terminen der Kanzlei prüfen
  const clash = await prisma.appointment.findFirst({
    where: {
      organizationId: client.organizationId,
      startsAt,
      status: { in: ["REQUESTED", "CONFIRMED"] },
    },
  });
  if (clash) return { error: "Dieses Zeitfenster wurde bereits gebucht. Bitte wählen Sie ein anderes." };

  const typeLabels = {
    INITIAL: "Erstgespräch",
    FOLLOW_UP: "Rückfrage",
    BWA_REVIEW: "BWA-Besprechung",
    ANNUAL_STATEMENT: "Jahresabschluss",
    TAX_ASSESSMENT: "Steuerbescheid",
    GENERAL: "Allgemeine Beratung",
  };
  const room = await createMeetingRoom({ organizationId: client.organizationId, title: typeLabels[parsed.data.type] });

  const appointment = await prisma.appointment.create({
    data: {
      organizationId: client.organizationId,
      clientId: client.id,
      type: parsed.data.type,
      title: typeLabels[parsed.data.type],
      startsAt,
      durationMinutes: 30,
      status: "REQUESTED",
      notes: parsed.data.note,
      meetingRoom: { create: { organizationId: client.organizationId, provider: room.provider, externalId: room.externalId, url: room.url, isDemo: room.isDemo } },
    },
  });
  await notifyOrgMembers({
    organizationId: client.organizationId,
    roles: ["OWNER", "STAFF"],
    type: "appointment",
    title: "Terminanfrage",
    body: `${client.name} möchte einen Termin am ${new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(startsAt)} buchen.`,
    link: `/appointments/${appointment.id}`,
  });
  await logAudit({
    organizationId: client.organizationId,
    actorId: user.id,
    actorName: client.name,
    action: "appointment.booked_by_client",
    entityType: "Appointment",
    entityId: appointment.id,
  });
  revalidatePath("/portal/appointments");
  revalidatePath("/appointments");
  return { success: "Terminanfrage gesendet – die Kanzlei bestätigt den Termin." };
}

/* -------------------------------- Freigaben -------------------------------- */

export async function createApprovalRequestAction(prevState, formData) {
  const { user, organization } = await guard("approvals.request");
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) return { error: "Mandant nicht gefunden." };
  const documentId = String(formData.get("documentId") || "") || null;

  const parsed = approvalRequestSchema.safeParse({
    clientId,
    documentId,
    title: formData.get("title") || "",
    message: formData.get("message") || "",
    dueDate: formData.get("dueDate") || "",
    kind: formData.get("kind") || "DOCUMENT",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const approval = await prisma.approvalRequest.create({
    data: {
      organizationId: organization.id,
      clientId,
      documentId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      message: parsed.data.message,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      requestedById: user.id,
    },
  });
  if (client.portalUserId) {
    await createNotification({
      organizationId: organization.id,
      userId: client.portalUserId,
      type: "approval",
      title: "Freigabe angefordert",
      body: parsed.data.title,
      link: "/portal/approvals",
    });
  }
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "approval.requested",
    entityType: "ApprovalRequest",
    entityId: approval.id,
    metadata: { title: parsed.data.title },
  });
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  return { success: "Freigabeanfrage an Mandant gesendet." };
}

/** Portal: Mandant entscheidet über Freigabe (einfache Bestätigung, KEINE qualifizierte elektronische Signatur). */
export async function decideApprovalAction(prevState, formData) {
  const { user, client } = await guardPortal("portal.approvals.decide");
  const parsed = approvalDecisionSchema.safeParse({
    requestId: formData.get("requestId") || "",
    decision: formData.get("decision") || "",
    comment: formData.get("comment") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const request = await prisma.approvalRequest.findFirst({
    where: { id: parsed.data.requestId, organizationId: client.organizationId, clientId: client.id },
  });
  if (!request) return { error: "Freigabeanfrage nicht gefunden." };
  if (request.status !== "PENDING") return { error: "Diese Anfrage wurde bereits bearbeitet." };

  await prisma.approvalDecision.create({
    data: {
      requestId: request.id,
      decidedById: user.id,
      decision: parsed.data.decision,
      comment: parsed.data.comment,
    },
  });
  await prisma.approvalRequest.update({
    where: { id: request.id },
    data: { status: parsed.data.decision, decidedAt: new Date() },
  });
  await notifyOrgMembers({
    organizationId: client.organizationId,
    roles: ["OWNER", "STAFF"],
    type: "approval",
    title: "Mandantenfreigabe",
    body: `${client.name}: ${parsed.data.decision === "APPROVED" ? "freigegeben" : parsed.data.decision === "REJECTED" ? "abgelehnt" : "Änderung angefordert"} – ${request.title}`,
    link: "/approvals",
  });
  await logAudit({
    organizationId: client.organizationId,
    actorId: user.id,
    actorName: client.name,
    action: "approval.decided_by_client",
    entityType: "ApprovalRequest",
    entityId: request.id,
    metadata: { decision: parsed.data.decision },
  });
  revalidatePath("/portal/approvals");
  revalidatePath("/portal");
  revalidatePath("/approvals");
  return { success: "Entscheidung gespeichert. Vielen Dank!" };
}

/* ------------------------------- Auswertungen ------------------------------ */

export async function createReportNoteAction(prevState, formData) {
  const { user, organization } = await guard("reports.manage");
  const parsed = reportNoteSchema.safeParse({
    clientId: formData.get("clientId") || "",
    title: formData.get("title") || "",
    content: formData.get("content") || "",
    periodLabel: formData.get("periodLabel") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, organizationId: organization.id },
  });
  if (!client) return { error: "Mandant nicht gefunden." };
  await prisma.report.create({
    data: {
      organizationId: organization.id,
      clientId: client.id,
      kind: "CUSTOM",
      title: parsed.data.title,
      content: parsed.data.content,
      periodLabel: parsed.data.periodLabel,
      createdById: user.id,
    },
  });
  if (client.portalUserId) {
    await createNotification({
      organizationId: organization.id,
      userId: client.portalUserId,
      type: "report",
      title: "Neue Auswertung/Notiz",
      body: parsed.data.title,
      link: "/portal/reports",
    });
  }
  revalidatePath("/reports");
  return { success: "Notiz veröffentlicht." };
}

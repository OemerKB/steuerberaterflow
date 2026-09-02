import { z } from "zod";

const email = z.email({ message: "Bitte eine gültige E-Mail-Adresse angeben." });
const requiredString = (min = 1, message = "Dieses Feld ist erforderlich.") =>
  z.string().min(min, message).trim();

/* ---------------------------------- Auth ---------------------------------- */

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Bitte Passwort eingeben."),
});

export const inviteAcceptSchema = z
  .object({
    name: requiredString(2, "Bitte Vor- und Nachnamen angeben."),
    password: z
      .string()
      .min(10, "Das Passwort muss mindestens 10 Zeichen lang sein."),
    passwordConfirm: z.string().min(1, "Bitte Passwort wiederholen."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Bitte aktuelles Passwort eingeben."),
    newPassword: z.string().min(10, "Das neue Passwort muss mindestens 10 Zeichen lang sein."),
    passwordConfirm: z.string().min(1, "Bitte Passwort wiederholen."),
  })
  .refine((d) => d.newPassword === d.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

/* -------------------------------- Kanzlei --------------------------------- */

export const organizationSettingsSchema = z.object({
  name: requiredString(2, "Bitte Kanzleinamen angeben."),
  street: z.string().trim().optional().default(""),
  postalCode: z.string().trim().max(10).optional().default(""),
  city: z.string().trim().optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().optional().default(""),
  website: z.string().trim().optional().default(""),
  timezone: requiredString(1),
  locale: z.enum(["de-DE"]).default("de-DE"),
  emailFromName: z.string().trim().max(80).optional().default(""),
  aiEnabled: z.boolean().default(false),
  aiSummaryEnabled: z.boolean().default(false),
});

export const inviteMemberSchema = z.object({
  email,
  name: requiredString(2, "Bitte Namen angeben."),
  role: z.enum(["STAFF", "ACCOUNTANT"]),
});

/* -------------------------------- Mandant --------------------------------- */

export const clientTypeEnum = z.enum([
  "INDIVIDUAL",
  "SOLE_TRADER",
  "FREELANCER",
  "GMBH",
  "UG",
  "ASSOCIATION",
  "LANDLORD",
  "PRIVATE",
]);

export const clientStatusEnum = z.enum(["ACTIVE", "ARCHIVED"]);

export const clientBaseSchema = z.object({
  type: clientTypeEnum,
  name: requiredString(2, "Bitte Namen oder Firmierung angeben."),
  company: z.string().trim().optional().default(""),
  taxNumber: z.string().trim().max(30).optional().default(""),
  vatId: z.string().trim().max(20).optional().default(""),
  email: z.string().trim().optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  street: z.string().trim().optional().default(""),
  postalCode: z.string().trim().max(10).optional().default(""),
  city: z.string().trim().optional().default(""),
  responsibleUserId: z.string().uuid("Bitte zuständigen Mitarbeiter wählen.").nullable().optional(),
  status: clientStatusEnum.default("ACTIVE"),
});

export const clientCreateSchema = clientBaseSchema.extend({
  contactName: z.string().trim().optional().default(""),
  contactEmail: z.string().trim().optional().default(""),
  contactPhone: z.string().trim().optional().default(""),
  taxTypes: z.array(z.string()).default([]),
  sendInvite: z.boolean().default(true),
});

export const clientContactSchema = z.object({
  name: requiredString(2, "Bitte Namen angeben."),
  role: z.string().trim().max(60).optional().default(""),
  email: z.string().trim().optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  isPrimary: z.boolean().default(false),
});

export const clientNoteSchema = z.object({
  content: requiredString(3, "Bitte Notiz eingeben."),
  isInternal: z.boolean().default(true),
});

/* -------------------------------- Dokumente ------------------------------- */

export const documentCategoryEnum = z.enum([
  "INVOICE_IN",
  "INVOICE_OUT",
  "BANK",
  "CASH",
  "CONTRACT",
  "TAX_ASSESSMENT",
  "BWA",
  "ANNUAL_STATEMENT",
  "PAYROLL",
  "PERSONNEL",
  "POWER_OF_ATTORNEY",
  "OTHER",
]);

export const documentStatusEnum = z.enum([
  "NEW",
  "ANALYZING",
  "REVIEW",
  "QUESTION",
  "ACCEPTED",
  "REJECTED",
  "ARCHIVED",
]);

export const documentMetadataSchema = z.object({
  clientId: z.string().uuid("Bitte Mandanten wählen.").nullable().optional(),
  category: documentCategoryEnum,
  title: requiredString(2, "Bitte Titel angeben."),
  taxYear: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
  month: z.coerce.number().int().min(1).max(12).nullable().optional(),
  description: z.string().trim().max(2000).optional().default(""),
  tags: z.array(z.string().trim().max(40)).max(10).default([]),
});

export const documentUpdateSchema = documentMetadataSchema.partial().extend({
  status: documentStatusEnum.optional(),
});

export const documentCommentSchema = z.object({
  content: requiredString(1, "Bitte Kommentar eingeben."),
  isInternal: z.boolean().default(false),
});

/* --------------------------- Fehlende Unterlagen -------------------------- */

export const requestStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "FULFILLED", "CANCELLED"]);

export const documentRequestSchema = z.object({
  clientId: z.string().uuid("Bitte Mandanten wählen."),
  title: requiredString(3, "Bitte Titel angeben."),
  description: z.string().trim().max(2000).optional().default(""),
  dueDate: z.string().optional().default(""),
  periodLabel: z.string().trim().max(60).optional().default(""),
  items: z
    .array(
      z.object({
        title: requiredString(2, "Bitte Unterlage angeben."),
        dueDate: z.string().optional().default(""),
      })
    )
    .min(1, "Bitte mindestens eine Unterlage hinzufügen."),
});

export const requestItemStatusEnum = z.enum(["MISSING", "UPLOADED", "ACCEPTED", "WAIVED"]);

/* --------------------------------- Aufgaben ------------------------------- */

export const taskStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "WAITING_FIRM",
  "DONE",
  "ARCHIVED",
]);

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const taskSchema = z.object({
  title: requiredString(3, "Bitte Titel angeben."),
  description: z.string().trim().max(4000).optional().default(""),
  clientId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: taskPriorityEnum.default("MEDIUM"),
  status: taskStatusEnum.default("OPEN"),
  dueDate: z.string().optional().default(""),
  tags: z.array(z.string().trim().max(40)).max(10).default([]),
  checklist: z.array(z.object({ text: requiredString(1) })).max(30).default([]),
});

/* --------------------------------- Fristen -------------------------------- */

export const deadlineStatusEnum = z.enum(["PLANNED", "IN_PROGRESS", "DONE", "MISSED"]);

export const deadlineSchema = z.object({
  title: requiredString(3, "Bitte Titel angeben."),
  clientId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().min(1, "Bitte Datum angeben."),
  priority: taskPriorityEnum.default("MEDIUM"),
  status: deadlineStatusEnum.default("PLANNED"),
  recurrence: z.enum(["NONE", "MONTHLY", "QUARTERLY", "YEARLY"]).default("NONE"),
  reminderDays: z.coerce.number().int().min(0).max(90).default(7),
  notes: z.string().trim().max(2000).optional().default(""),
  documentId: z.string().uuid().nullable().optional(),
});

/* ------------------------------- Nachrichten ------------------------------ */

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: requiredString(1, "Bitte Nachricht eingeben."),
  isInternal: z.boolean().default(false),
});

export const conversationStartSchema = z.object({
  clientId: z.string().uuid().optional(),
  subject: requiredString(3, "Bitte Betreff angeben."),
  content: requiredString(1, "Bitte Nachricht eingeben."),
  isInternal: z.boolean().default(false),
});

/* --------------------------------- Termine -------------------------------- */

export const appointmentTypeEnum = z.enum([
  "INITIAL",
  "FOLLOW_UP",
  "BWA_REVIEW",
  "ANNUAL_STATEMENT",
  "TAX_ASSESSMENT",
  "GENERAL",
]);

export const appointmentStatusEnum = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

export const appointmentSchema = z.object({
  clientId: z.string().uuid("Bitte Mandanten wählen."),
  type: appointmentTypeEnum.default("GENERAL"),
  title: requiredString(3, "Bitte Titel angeben."),
  startsAt: z.string().min(1, "Bitte Startzeit angeben."),
  durationMinutes: z.coerce.number().int().min(15).max(240).default(30),
  consultantId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const appointmentBookingSchema = z.object({
  type: appointmentTypeEnum,
  slotId: requiredString(1),
  note: z.string().trim().max(500).optional().default(""),
});

/* -------------------------------- Freigaben ------------------------------- */

export const approvalStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "CHANGES"]);

export const approvalRequestSchema = z.object({
  clientId: z.string().uuid("Bitte Mandanten wählen."),
  documentId: z.string().uuid().nullable().optional(),
  title: requiredString(3, "Bitte Titel angeben."),
  message: z.string().trim().max(2000).optional().default(""),
  dueDate: z.string().optional().default(""),
  kind: z.enum(["DOCUMENT", "REPORT", "GENERAL"]).default("DOCUMENT"),
});

export const approvalDecisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED", "CHANGES"]),
  comment: z.string().trim().max(2000).optional().default(""),
});

/* -------------------------------- Auswertungen ---------------------------- */

export const reportNoteSchema = z.object({
  clientId: z.string().uuid(),
  title: requiredString(3, "Bitte Titel angeben."),
  content: requiredString(3, "Bitte Text angeben."),
  periodLabel: z.string().trim().max(60).optional().default(""),
});

/* ------------------------------ Onboarding -------------------------------- */

export const onboardingSchema = z.object({
  type: clientTypeEnum,
  name: requiredString(2, "Bitte Namen angeben."),
  company: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  street: z.string().trim().optional().default(""),
  postalCode: z.string().trim().max(10).optional().default(""),
  city: z.string().trim().optional().default(""),
  taxNumber: z.string().trim().max(30).optional().default(""),
  vatId: z.string().trim().max(20).optional().default(""),
  contactName: z.string().trim().optional().default(""),
  contactEmail: z.string().trim().optional().default(""),
  taxTypes: z.array(z.string()).default([]),
  requiredDocuments: z.array(z.string()).default([]),
  responsibleUserId: z.string().uuid().nullable().optional(),
  sendInvite: z.boolean().default(true),
});

/* ------------------------------- Plattform -------------------------------- */

export const adminOrgActionSchema = z.object({
  organizationId: z.string().uuid(),
  action: z.enum(["SUSPEND", "ACTIVATE"]),
  reason: z.string().trim().max(500).optional().default(""),
});

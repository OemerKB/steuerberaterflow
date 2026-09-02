/** Deutsche Labels für Enums und Statuswerte (eine Quelle für UI). */

export const ROLE_LABELS = {
  OWNER: "Kanzleiinhaber",
  STAFF: "Mitarbeiter",
  ACCOUNTANT: "Externer Buchhalter",
  CLIENT: "Mandant",
};

export const CLIENT_TYPE_LABELS = {
  INDIVIDUAL: "Einzelunternehmen",
  SOLE_TRADER: "Einzelunternehmen",
  FREELANCER: "Freiberufler",
  GMBH: "GmbH",
  UG: "UG",
  ASSOCIATION: "Verein",
  LANDLORD: "Vermieter",
  PRIVATE: "Privatperson",
};

export const DOCUMENT_CATEGORY_LABELS = {
  INVOICE_IN: "Eingangsrechnung",
  INVOICE_OUT: "Ausgangsrechnung",
  BANK: "Bank",
  CASH: "Kasse",
  CONTRACT: "Vertrag",
  TAX_ASSESSMENT: "Steuerbescheid",
  BWA: "BWA",
  ANNUAL_STATEMENT: "Jahresabschluss",
  PAYROLL: "Lohn",
  PERSONNEL: "Personal",
  POWER_OF_ATTORNEY: "Vollmacht",
  OTHER: "Sonstiges",
};

/** Belegarten = buchungsrelevante Kategorien */
export const RECEIPT_CATEGORIES = ["INVOICE_IN", "INVOICE_OUT", "BANK", "CASH"];

export const DOCUMENT_STATUS_LABELS = {
  NEW: "Neu",
  ANALYZING: "Wird analysiert",
  REVIEW: "Zu prüfen",
  QUESTION: "Rückfrage",
  ACCEPTED: "Akzeptiert",
  REJECTED: "Abgelehnt",
  ARCHIVED: "Archiviert",
};

export const DOCUMENT_STATUS_TONES = {
  NEW: "blue",
  ANALYZING: "amber",
  REVIEW: "amber",
  QUESTION: "amber",
  ACCEPTED: "green",
  REJECTED: "red",
  ARCHIVED: "gray",
};

export const REQUEST_STATUS_LABELS = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  FULFILLED: "Vollständig",
  CANCELLED: "Abgebrochen",
};

export const REQUEST_ITEM_STATUS_LABELS = {
  MISSING: "Fehlt",
  UPLOADED: "Eingegangen",
  ACCEPTED: "Geprüft",
  WAIVED: "Nicht erforderlich",
};

export const TASK_STATUS_LABELS = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  WAITING_CLIENT: "Wartet auf Mandant",
  WAITING_FIRM: "Wartet auf Kanzlei",
  DONE: "Erledigt",
  ARCHIVED: "Archiviert",
};

export const TASK_STATUS_TONES = {
  OPEN: "blue",
  IN_PROGRESS: "amber",
  WAITING_CLIENT: "amber",
  WAITING_FIRM: "gray",
  DONE: "green",
  ARCHIVED: "gray",
};

export const TASK_PRIORITY_LABELS = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  URGENT: "Dringend",
};

export const TASK_PRIORITY_TONES = {
  LOW: "gray",
  MEDIUM: "blue",
  HIGH: "amber",
  URGENT: "red",
};

export const DEADLINE_STATUS_LABELS = {
  PLANNED: "Geplant",
  IN_PROGRESS: "In Bearbeitung",
  DONE: "Erledigt",
  MISSED: "Überfällig",
};

export const DEADLINE_STATUS_TONES = {
  PLANNED: "blue",
  IN_PROGRESS: "amber",
  DONE: "green",
  MISSED: "red",
};

export const APPOINTMENT_TYPE_LABELS = {
  INITIAL: "Erstgespräch",
  FOLLOW_UP: "Rückfrage",
  BWA_REVIEW: "BWA-Besprechung",
  ANNUAL_STATEMENT: "Jahresabschluss",
  TAX_ASSESSMENT: "Steuerbescheid",
  GENERAL: "Allgemeine Beratung",
};

export const APPOINTMENT_STATUS_LABELS = {
  REQUESTED: "Angefragt",
  CONFIRMED: "Bestätigt",
  CANCELLED: "Abgesagt",
  COMPLETED: "Abgeschlossen",
};

export const APPROVAL_STATUS_LABELS = {
  PENDING: "Wartet auf Freigabe",
  APPROVED: "Freigegeben",
  REJECTED: "Abgelehnt",
  CHANGES: "Änderung angefordert",
};

export const APPROVAL_STATUS_TONES = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CHANGES: "blue",
};

export const APPROVAL_KIND_LABELS = {
  DOCUMENT: "Dokument prüfen",
  REPORT: "Auswertung prüfen",
  GENERAL: "Bestätigung",
};

export const TAX_TYPE_LABELS = {
  UST: "Umsatzsteuer",
  EUST: "Umsatzsteuer (Einfuhr)",
  EINK: "Einkommensteuer",
  GEW: "Gewerbesteuer",
  LOHN: "Lohnsteuer",
  KAP: "Kapitalertragsteuer",
  JAEHR: "Jahresabschluss",
};

export const CONVERSATION_TYPE_LABELS = {
  CLIENT: "Mandant",
  INTERNAL: "Intern",
};

export const REPORT_KIND_LABELS = {
  SUMMARY: "Zusammenfassung",
  BWA_NOTE: "BWA-Hinweis",
  TAX_NOTE: "Steuerbescheid-Hinweis",
  CUSTOM: "Notiz",
};

/** Bearbeitungsstatus der Mandantenakte (berechnet, nicht gespeichert) */
export const CLIENT_PROCESS_STATUS = {
  COMPLETE: { label: "Vollständig", tone: "green" },
  MISSING_DOCS: { label: "Unterlagen fehlen", tone: "amber" },
  OPEN_QUESTION: { label: "Rückfrage offen", tone: "blue" },
  IN_PROGRESS: { label: "In Bearbeitung", tone: "blue" },
  WAITING_APPROVAL: { label: "Wartet auf Freigabe", tone: "amber" },
  DONE: { label: "Abgeschlossen", tone: "green" },
};

export function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value ?? 0);
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(date, opts = {}) {
  if (!date) return "–";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", ...opts }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return "–";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export function formatMonthYear(date) {
  if (!date) return "–";
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date(date));
}

export function relativeDueDate(date) {
  if (!date) return null;
  const now = new Date();
  const due = new Date(date);
  const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return { days, label: `${Math.abs(days)} Tage überfällig`, tone: "red" };
  if (days === 0) return { days, label: "Heute fällig", tone: "red" };
  if (days === 1) return { days, label: "Morgen fällig", tone: "amber" };
  if (days <= 7) return { days, label: `in ${days} Tagen`, tone: "amber" };
  return { days, label: `in ${days} Tagen`, tone: "gray" };
}

/**
 * SteuerberaterFlow – zentrale Produktkonstanten.
 * Keine Secrets hier – nur nicht sensible Metadaten.
 */

export const APP_NAME = "SteuerberaterFlow";
export const APP_TAGLINE = "Weniger Verwaltungsaufwand. Mehr Zeit für Beratung.";

export const DEMO_ORG_SLUG = "faber-partner";

export const FILE_UPLOAD = {
  /** 10 MB – MVP-Limit, serverseitig erzwungen */
  maxBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
  ],
  allowedExtensions: [
    ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt", ".csv",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip",
  ],
};

export const SESSION = {
  cookieName: "sf_session",
  /** 7 Tage */
  maxAgeSeconds: 60 * 60 * 24 * 7,
};

export const PLANS = [
  {
    id: "solo",
    name: "Solo",
    price: "79 €",
    period: "pro Monat",
    blurb: "Für selbstständige Steuerberater und kleine Kanzleien.",
    features: [
      "1 Kanzleibenutzer",
      "bis 50 Mandanten",
      "Dokumentenportal",
      "Aufgaben und Fristen",
      "Nachrichten",
    ],
  },
  {
    id: "kanzlei",
    name: "Kanzlei",
    price: "249 €",
    period: "pro Monat",
    blurb: "Für Kanzleien mit Team und regelmäßiger Mandantenberatung.",
    highlight: true,
    features: [
      "bis 10 Mitarbeiter",
      "bis 500 Mandanten",
      "Video-Beratung",
      "Freigaben",
      "Automatisierungen",
      "Auswertungen",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "individuell",
    period: "",
    blurb: "Für größere Kanzleien mit besonderen Anforderungen.",
    features: [
      "individuelle Nutzung",
      "White Label",
      "API",
      "individuelles Onboarding",
      "priorisierter Support",
      "individuelle Integrationen",
    ],
  },
];

export const LIMITS = {
  solo: { users: 1, clients: 50 },
  kanzlei: { users: 10, clients: 500 },
  pro: { users: null, clients: null },
};

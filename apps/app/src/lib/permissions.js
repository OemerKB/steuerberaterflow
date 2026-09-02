/**
 * Rollen- und Berechtigungsmatrix – zentrale, serverseitige Autorisierung.
 * Diese Datei ist bewusst rein (keine DB-Zugriffe), damit sie unit-getestet werden kann.
 * Der Berechtigungskatalog in der DB (Model Permission) dokumentiert dieselbe Matrix.
 */

export const PERMISSIONS = {
  // Mandanten
  "clients.read": ["OWNER", "STAFF", "ACCOUNTANT"],
  "clients.read.assigned": ["ACCOUNTANT"],
  "clients.create": ["OWNER", "STAFF"],
  "clients.update": ["OWNER", "STAFF"],
  "clients.archive": ["OWNER"],
  "clients.invite": ["OWNER", "STAFF"],

  // Dokumente & Belege
  "documents.read": ["OWNER", "STAFF", "ACCOUNTANT"],
  "documents.create": ["OWNER", "STAFF", "ACCOUNTANT"],
  "documents.update": ["OWNER", "STAFF"],
  "documents.status": ["OWNER", "STAFF"],

  // Fehlende Unterlagen
  "requests.read": ["OWNER", "STAFF", "ACCOUNTANT"],
  "requests.manage": ["OWNER", "STAFF"],

  // Aufgaben
  "tasks.read": ["OWNER", "STAFF", "ACCOUNTANT"],
  "tasks.create": ["OWNER", "STAFF"],
  "tasks.update": ["OWNER", "STAFF", "ACCOUNTANT"],

  // Fristen
  "deadlines.read": ["OWNER", "STAFF"],
  "deadlines.manage": ["OWNER", "STAFF"],

  // Nachrichten
  "messages.read": ["OWNER", "STAFF", "ACCOUNTANT"],
  "messages.send": ["OWNER", "STAFF", "ACCOUNTANT"],

  // Termine
  "appointments.read": ["OWNER", "STAFF", "ACCOUNTANT"],
  "appointments.manage": ["OWNER", "STAFF"],

  // Freigaben
  "approvals.read": ["OWNER", "STAFF"],
  "approvals.request": ["OWNER", "STAFF"],

  // Auswertungen
  "reports.read": ["OWNER", "STAFF"],
  "reports.manage": ["OWNER", "STAFF"],

  // Team & Einstellungen
  "team.manage": ["OWNER"],
  "settings.manage": ["OWNER"],
  "audit.view": ["OWNER", "STAFF"],

  // Mandantenportal
  "portal.documents.upload": ["CLIENT"],
  "portal.requests.read": ["CLIENT"],
  "portal.tasks.read": ["CLIENT"],
  "portal.messages.read": ["CLIENT"],
  "portal.messages.send": ["CLIENT"],
  "portal.appointments.read": ["CLIENT"],
  "portal.appointments.book": ["CLIENT"],
  "portal.approvals.decide": ["CLIENT"],
  "portal.reports.read": ["CLIENT"],
};

/**
 * Prüft, ob eine Rolle die angeforderte Berechtigung besitzt.
 * @param {string} role OWNER|STAFF|ACCOUNTANT|CLIENT
 * @param {string} permission
 */
export function can(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/** Alias mit sprechendem Namen für Guards. */
export function assertPermission(role, permission) {
  if (!can(role, permission)) {
    const err = new Error(`Keine Berechtigung: ${permission}`);
    err.code = "FORBIDDEN";
    throw err;
  }
}

/**
 * Tenant-Isolation: Prüft, ob eine Entität zur Organisation der Session gehört.
 * Wird zusätzlich zu where:{organizationId} als Defense-in-Depth genutzt.
 */
export function belongsToOrg(entity, organizationId) {
  if (!entity) return false;
  return entity.organizationId === organizationId;
}

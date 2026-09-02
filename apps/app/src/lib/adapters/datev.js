import "server-only";

/**
 * DATEV-Export-Adapter (MVP).
 *Exportiert Belege als CSV-Datensätze (kommagetrennt, ISO-Daten) zum
 * Download als ZIP-fähige Grundlage. Keine offizielle DATEV-Schnittstelle –
 * kein Funktionsumfang wird vorgetäuscht (dokumentiert in docs/integrations.md).
 */

export function buildDatevCsv({ documents }) {
  const header = [
    "Umsatz (ohne Vorzeichen)",
    "Soll/Haben-Kz",
    "Buchungstext",
    "Belegdatum",
    "Beleg1",
    "Konto",
    "Gegenkonto (ohne BU-Schlüssel)",
    "BU-Schlüssel",
    "Beleg-Info",
  ].join(";");
  const rows = documents.map((d) => {
    const date = d.createdAt ? new Date(d.createdAt) : new Date();
    const belegdatum = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
    const clean = (s) => String(s ?? "").replace(/;/g, ",").replace(/\r?\n/g, " ").slice(0, 60);
    return [
      "", // Beträge werden nicht erfunden – Kanzlei ergänzt beim DATEV-Import
      "",
      clean(d.title),
      belegdatum,
      clean(d.id),
      "", // Konto
      "", // Gegenkonto
      "",
      clean(d.category),
    ].join(";");
  });
  return [header, ...rows].join("\r\n");
}

export const DATEV_NOTE =
  "Vorläufiger Export zur Vorbereitung eines DATEV-Imports. Beträge und Konten werden " +
  "nicht automatisch abgeleitet – die Kanzlei prüft und ergänzt die Daten im DATEV-Import.";

import "server-only";

/**
 * KI-Adapter – sicherer, austauschbarer Service-Layer.
 *
 * Regeln (dokumentiert in docs/security.md):
 * - Alle KI-Ausgaben sind ENTWÜRFE und werden als solche gekennzeichnet.
 * - Keine autonome Steuerberatung, keine verbindliche Fristsetzung, keine Buchungen.
 * - Jeder Vorschlag muss durch Menschen bestätigt werden.
 * - Ohne API-Key läuft ein transparenter Mock-Modus (heuristische Erkennung).
 * - KI ist pro Kanzlei deaktivierbar (OrganizationSettings.aiEnabled).
 */

export const aiConfigured = Boolean(process.env.OPENAI_API_KEY);
export const aiMode = aiConfigured ? "openai" : "mock";

/** Heuristische Schlüsselwörter pro Dokumentkategorie (Mock + Vorbereitung realer Extraktion). */
const CATEGORY_HINTS = [
  { category: "INVOICE_IN", keywords: ["rechnung", "eingangsrechnung", "rechnungsnummer", "zahlung bitte", "iban", "ust-id"] },
  { category: "INVOICE_OUT", keywords: ["gutschrift", "ausgangsrechnung", "ihre rechnung"] },
  { category: "BANK", keywords: ["kontoauszug", "bank", "kontobewegung", "saldo", "abbuchung"] },
  { category: "CASH", keywords: ["kassenbericht", "kasse", "barumsatz", "kassensturz"] },
  { category: "TAX_ASSESSMENT", keywords: ["steuerbescheid", "bescheiddatum", "finanzamt", "einspruch"] },
  { category: "BWA", keywords: ["bwa", "betriebswirtschaftliche auswertung", "erlös", "aufwand", "kostenstellen"] },
  { category: "CONTRACT", keywords: ["vertrag", "vereinbarung", "mietvertrag", "arbeitsvertrag"] },
  { category: "PAYROLL", keywords: ["lohnabrechnung", "gehaltsabrechnung", "brutto", "netto", "lohnsteuer"] },
  { category: "POWER_OF_ATTORNEY", keywords: ["vollmacht", "bevollmächtig", "steuerberatungsvollmacht"] },
];

/**
 * Erkennt Dokumententyp und schlägt Metadaten vor.
 * @returns {{category: string, suggestedTitle: string, confidence: number, isDraft: true, mode: string, notes: string}}
 */
export async function analyzeDocument({ fileName = "", textHint = "" }) {
  const haystack = `${fileName} ${textHint}`.toLowerCase();
  let best = { category: "OTHER", score: 0 };
  for (const hint of CATEGORY_HINTS) {
    const score = hint.keywords.reduce((acc, kw) => acc + (haystack.includes(kw) ? 1 : 0), 0);
    if (score > best.score) best = { category: hint.category, score };
  }
  const yearMatch = haystack.match(/20[0-9]{2}/);
  const monthMatch = haystack.match(/(?:0[1-9]|1[0-2])[-_.](?:20[0-9]{2})|(?:20[0-9]{2})[-_.](?:0[1-9]|1[0-2])/);

  return {
    isDraft: true,
    mode: aiConfigured ? "openai" : "mock",
    category: best.score > 0 ? best.category : "OTHER",
    confidence: best.score > 0 ? Math.min(0.6 + best.score * 0.15, 0.95) : 0.3,
    suggestedTitle: suggestTitle(fileName),
    suggestedYear: yearMatch ? Number(yearMatch[0]) : null,
    suggestedMonth: monthMatch ? Number(monthMatch[0].match(/(?:0[1-9]|1[0-2])/)[0]) : null,
    notes:
      best.score > 0
        ? "Vorschlag basiert auf erkannten Schlüsselwörtern im Dateinamen."
        : "Keine eindeutigen Schlüsselwörter erkannt – bitte Kategorie manuell prüfen.",
  };
}

function suggestTitle(fileName) {
  const base = fileName.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ");
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Neues Dokument";
}

/**
 * Findet mögliche Duplikate anhand von Prüfsummen (SHA-256) und ähnlichen Titeln.
 * Gibt immer nur Hinweise (Entwürfe) zurück – keine automatische Löschung.
 */
export async function findDuplicateHints({ checksum, organizationId, excludeDocumentId }) {
  const { prisma } = await import("../db");
  const dupes = await prisma.document.findMany({
    where: {
      organizationId,
      id: excludeDocumentId ? { not: excludeDocumentId } : undefined,
      versions: { some: { checksum } },
    },
    select: { id: true, title: true, createdAt: true },
    take: 3,
  });
  return dupes.map((d) => ({
    documentId: d.id,
    title: d.title,
    reason: "Identische Datei-Prüfsumme",
    isDraft: true,
  }));
}

/**
 * Fassungs-Vorschlag für Steuerbescheide in einfacher Sprache (Mock).
 * Gibt klar gekennzeichnete Entwürfe ohne steuerliche Bewertung zurück.
 */
export async function summarizeTaxAssessment({ documentTitle, excerpt = "" }) {
  if (aiConfigured && excerpt) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Du fasst deutsche Steuerbescheide in einfacher, verständlicher Sprache zusammen. " +
                "Gib keine steuerliche Beratung. Weise klar darauf hin, dass es ein Entwurf ist. " +
                "Struktur: 1) Worum geht es 2) Die wichtigsten Zahlen 3) Was der Mandant tun sollte.",
            },
            { role: "user", content: `Titel: ${documentTitle}\n\nInhalt: ${excerpt.slice(0, 6000)}` },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return {
          isDraft: true,
          mode: "openai",
          summary: json.choices?.[0]?.message?.content?.trim() || "",
          disclaimer:
            "KI-Entwurf – bitte vor Verwendung prüfen. Kein Ersatz für die steuerliche Beratung.",
        };
      }
    } catch (err) {
      console.error("[ai] Zusammenfassung fehlgeschlagen, nutze Mock:", err.message);
    }
  }

  return {
    isDraft: true,
    mode: "mock",
    summary:
      `Entwurf (Demo-Modus): Der Bescheid „${documentTitle}" wurde erfasst. ` +
      "Im Demo-Modus wird keine echte Inhaltanalyse durchgeführt. Sobald ein KI-Provider konfiguriert " +
      "ist, erstellt dieser Vorschlag eine verständliche Zusammenfassung mit den wichtigsten Zahlen.",
    disclaimer:
      "KI-Entwurf (Mock-Modus) – bitte vor Verwendung prüfen. Kein Ersatz für die steuerliche Beratung.",
  };
}

# Integrations-Architektur

Alle Integrationen laufen über austauschbare Adapter in `apps/app/src/lib/adapters/`. Ohne Konfiguration funktioniert die Plattform vollständig (Demo-/Mock-Modi sind klar gekennzeichnet); es werden keine nicht vorhandenen Verbindungen vorgetäuscht.

## Adapter-Übersicht

| Adapter | Datei | Aktiv | Vorbereitet / Demo |
| --- | --- | :-: | :-: |
| E-Mail | `email.js` | mit `RESEND_API_KEY` (Resend REST) | Demo-Modus: strukturiertes Logging + Portal-Benachrichtigung |
| Video-Meetings | `video.js` | mit `DAILY_API_KEY` (Daily REST, vorbereitet) | Demo-Meetingraum: simulierte Kamera/Mikrofon/Bildschirmfreigabe, „Keine aktive Verbindung"-Kennzeichnung |
| KI | `ai.js` | mit `OPENAI_API_KEY` (Zusammenfassungen) | Heuristischer Mock (Kategorie-Erkennung, Titel-Vorschläge, Duplikat-Hinweise) |
| Storage | `storage.js` | `STORAGE_DRIVER=db` (Dateien in PostgreSQL) | Supabase-S3-Treiber dokumentiert |
| DATEV | `datev.js` | CSV-Export (aktiv) | ZIP-Bündelung + offizielle DATEV-Schnittstelle (Roadmap) |
| Stripe | `stripe.js` | – | Phase 3; Kundenerstellung/Checkout vorbereitet |
| Kalender | – | – | ICS-Export / Google-/Outlook-Sync (Roadmap) |
| Digitale Signatur | – | – | Provider-Schnittstelle für QES (Roadmap) |
| OCR | – | – | Texterkennung als Vorbereitung der KI-Metadaten (Roadmap) |
| Banking | – | – | Kontoschnittstellen (Roadmap, Phase 3) |

## DATEV-Export (ehrlich beschrieben)

`buildDatevCsv()` erzeugt CSV-Datensätze (Semikolon-getrennt, ISO-Datum) mit Titel, Belegdatum, Beleg-ID und Kategorie. **Beträge und Konten werden nicht erfunden** – die Kanzlei ergänzt sie beim DATEV-Import. Der Export ist als Vorbereitung gekennzeichnet (`DATEV_NOTE`), keine offizielle DATEV-Anbindung.

## KI-Sicherheitsregeln

1. Alle KI-Ausgaben tragen `isDraft: true` und werden in der UI als Entwurf gekennzeichnet.
2. Keine autonome Steuerberatung, keine verbindliche Fristsetzung, keine automatischen Buchungen.
3. Jeder Vorschlag erfordert menschliche Bestätigung.
4. Sensible Daten gehen nur an konfigurierte, freigegebene Provider; im Mock-Modus verlässt nichts die Instanz.
5. KI ist pro Kanzlei deaktivierbar (`OrganizationSettings.aiEnabled` / `aiSummaryEnabled`).

## E-Mail-Templates

Vordefinierte, barrierearme HTML/Text-Templates für Einladungen (`invitationEmail`) und Unterlagen-Erinnerungen (`reminderEmail`). Ohne API-Key werden die Inhalte nur protokolliert – sichtbar im Server-Log, nirgends als „versendet" behauptet.

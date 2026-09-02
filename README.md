# SteuerberaterFlow

> Weniger Verwaltungsaufwand. Mehr Zeit für Beratung.

**SteuerberaterFlow** ist die digitale Zusammenarbeitsebene zwischen Steuerkanzleien und ihren Mandanten: eine zentrale Plattform für Unterlagen, fehlende Dokumente, Aufgaben, Fristen, Nachrichten, Termine mit Video-Beratung, Freigaben und verständliche Auswertungen.

Die Software ersetzt **keine** Buchhaltungs- oder DATEV-Software. Sie bildet die moderne, verständliche Kommunikations-, Dokumenten- und Workflow-Schicht zwischen Kanzlei und Mandant.

---

## Produktüberblick

| Bereich | Inhalt |
| --- | --- |
| Kanzlei-Dashboard | Live-Kennzahlen (aktive Mandanten, offene/überfällige Aufgaben, fehlende Unterlagen, Freigaben, Fristen, Termine, Nachrichten), „Heute wichtig", Auslastung nach Mitarbeiter, Quick Actions |
| Mandantenverwaltung | Tabelle mit Suche/Filter/Sortierung/Pagination/CSV-Export/Mehrfachauswahl, verständlicher Bearbeitungsstatus |
| Digitale Mandantenakte | 12 Tabs: Übersicht, Stammdaten, Ansprechpartner, Dokumente, Belege, Aufgaben, Fristen, Nachrichten, Termine, Freigaben, Notizen, Aktivitäten |
| Onboarding | Geführter Wizard (7 Schritte) mit Fortschritt in Prozent und Unterlagen-Checkliste |
| Dokumente & Belege | Drag-and-Drop-Upload, Kategorien, Steuerjahr/Monat, Tags, Versionen, Kommentare, Status-Workflow, geschützte Downloads, Vorschau |
| Fehlende Unterlagen | Unterlagenpakete (z. B. „Monatsbuchhaltung August 2026") mit Einzelstatus, Erinnerungs-Queue-Abstraktion |
| Aufgaben | Liste + Kanban, Meine Aufgaben, überfällig, wartet auf Mandant, Checklisten |
| Fristen | Liste + Kalender, Wiederholungen, Erinnerungsintervalle (Vorlagen – keine rechtsverbindliche Fristautomatik) |
| Nachrichten | Konversationen pro Mandant, interne Kanzleinotizen (niemals für Mandanten sichtbar), Unread-Tracking |
| Termine | Terminarten, Buchung über Zeitfenster, Demo-Meetingraum mit simulierter Kamera/Mikrofon/Bildschirmfreigabe |
| Freigaben | Dokumente zur Kenntnis/Freigabe senden, Entscheidung mit Audit-Eintrag (keine qualifizierte elektronische Signatur) |
| Auswertungen | Verständliche Aufbereitungen mit Charts, klar als Beispieldaten gekennzeichnet |
| Mandantenportal | Mobil-first: Start, Aufgaben, Unterlagen, Dokumente, Nachrichten, Termine, Freigaben, Auswertungen, Einstellungen |
| Plattform-Admin | Kanzleien verwalten/sperren, Benutzer, Speicherverbrauch, Systemereignisse, Supportfälle, Feature Flags |
| KI-Assistent | Austauschbare Service-Schicht; Mock-Modus ohne API-Key; alle Ausgaben sind gekennzeichnete Entwürfe |

![Dashboard-Mockup](docs/images/dashboard-mockup-placeholder.png)

> Screenshots: Siehe `docs/screenshots.md` (Sektion vorbereitet; Aufnahme aus der laufenden Demo möglich).

---

## Screenshots (Sektion vorbereitet)

- Kanzlei-Dashboard mit Live-Kennzahlen
- Mandantenübersicht mit Bearbeitungsstatus
- Digitale Mandantenakte (12 Tabs)
- Fehlende Unterlagen (Kanzlei- und Mandantensicht)
- Kanban-Aufgabenboard
- Mandantenportal (mobil)
- Demo-Meetingraum
- Landingpage-Hero

---

## Voraussetzungen

- Node.js ≥ 20.9 (empfohlen: 22 LTS)
- npm ≥ 10
- PostgreSQL-Datenbank (z. B. [Neon](https://neon.tech), Supabase oder lokal via Docker)
- Optional: Docker (für lokales Postgres)

---

## Installation

```bash
git clone https://github.com/OemerKB/steuerberaterflow.git
cd steuerberaterflow
npm install
cp .env.example .env   # Werte eintragen (siehe unten)
```

### Environment Variables

| Variable | Pflicht | Beschreibung |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL-Verbindung (pooled) |
| `DATABASE_URL_UNPOOLED` | – | Ungepoolte Verbindung (z. B. für Migrationen bei Neon) |
| `AUTH_SECRET` | ✅ | Secret für Session-Sicherheit (mind. 32 Zeichen) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Öffentliche URL der App (für Einladungslinks) |
| `NEXT_PUBLIC_LANDING_URL` | – | URL der Landingpage |
| `RESEND_API_KEY` | – | E-Mail-Versand; ohne Key werden E-Mails nur protokolliert (Demo-Modus) |
| `EMAIL_FROM` | – | Absenderadresse |
| `DAILY_API_KEY` / `DAILY_DOMAIN` | – | Video-Provider (Daily); ohne Key läuft der Demo-Meetingraum |
| `OPENAI_API_KEY` | – | KI-Analyse; ohne Key läuft der Mock-Modus |
| `STORAGE_DRIVER` | – | `db` (Standard: Dateien in PostgreSQL, geschützte Downloads) |
| `STRIPE_SECRET_KEY` | – | Phase 3, im MVP inaktiv |

**Niemals Secrets committen.** `.env` ist in `.gitignore` ausgeschlossen.

---

## Datenbankmigration

```bash
npm run db:migrate          # prisma migrate deploy (Produktion/CI)
npm run db:migrate:dev      # prisma migrate dev (lokale Entwicklung)
npm run db:studio           # Prisma Studio
```

## Seed (Demo-Daten)

```bash
npm run db:seed             # Demo-Kanzlei „Faber & Partner" mit allen Demo-Daten
```

> Das Seed-Skript leert zuerst alle Tabellen (TRUNCATE). Nur in Demo-/Entwicklungsumgebungen verwenden!

---

## Lokale Entwicklung

```bash
npm run dev:app       # SaaS-App auf http://localhost:3000
npm run dev:landing   # Landingpage auf http://localhost:3001
```

## Tests

```bash
npm run test          # Vitest: Berechtigungen, Tenant-Isolation, Workflow, Validierung (47 Tests)
npm run test:e2e      # Playwright: 8 End-to-End-Flows ( benötigt Build + DB )
npm run lint          # ESLint (alle Workspaces)
npm run build         # Production-Builds beider Apps
```

E2E gegen einen laufenden Server (produktiver Build):

```bash
npm run build:app
cd apps/app && npx next start -p 3100 &   # oder eigener Port: E2E_PORT=PORT
cd .. && E2E_NO_SERVER=1 E2E_PORT=3100 npx playwright test
```

---

## Deployment

Zwei Vercel-Projekte aus demselben Repository (Root Directory konfigurieren):

| Projekt | Root Directory | Domain (Beispiel) |
| --- | --- | --- |
| `steuerberaterflow-app` | `apps/app` | App-URL |
| `steuerberaterflow-landing` | `apps/landing` | Landing-URL |

Details: [`docs/deployment.md`](docs/deployment.md)

---

## Demo-Zugänge

Nach `npm run db:seed` (Passwort für alle Konten: `demo1234!`):

| Rolle | E-Mail | Sicht |
| --- | --- | --- |
| Kanzleiinhaberin | `julia.faber@faber-partner.demo` | Volle Kanzleiansicht |
| Steuerberater | `daniel.weber@faber-partner.demo` | Operative Kanzleiansicht |
| Sachbearbeiterin (extern) | `lisa.koenig@faber-partner.demo` | Eingeschränkte Sicht auf zugewiesene Mandanten |
| Mandant | `mandant@nordstern-bau.demo` | Mandantenportal (Nordstern Bau GmbH) |
| Plattform-Admin | `admin@steuerberaterflow.demo` | Plattform-Administration |

Weitere Mandantenportale: `mandant@kaya.demo`, `mandant@studio-form.demo`, `mandant@cafe-morgenrot.demo`, `mandant@lena-hoffmann.demo`, `mandant@gruenwerk.demo`.

Sicherheitshinweis: Diese Konten sind ausschließlich für Demo-Umgebungen gedacht. In produktiven Setups alle Demo-Passwörter ändern bzw. Konten deaktivieren. Details: [`docs/demo-accounts.md`](docs/demo-accounts.md).

---

## Bekannte Einschränkungen (ehrlich dokumentiert)

- **Keine offizielle DATEV-Integration.** Der Export ist eine CSV-Grundlage; Beträge/Konten werden nicht automatisch abgeleitet.
- **Keine rechtsverbindliche Fristautomatik.** Fristen sind Vorlagen/Erinnerungen und fachlich durch die Kanzlei zu prüfen.
- **Freigaben sind keine qualifizierte elektronische Signatur.** Sie dokumentieren die Kenntnisnahme im Portal.
- **KI-Funktionen laufen ohne API-Key im Mock-Modus** und liefern immer nur Entwürfe; keine autonome Steuerberatung.
- **E-Mail-Versand nur mit konfiguriertem Resend-Key.** Ohne Key werden E-Mails protokolliert (Demo-Modus) und als Portal-Benachrichtigungen erzeugt.
- **Video-Beratung ohne konfigurierten Provider nur als Demo-Meetingraum** (simulierte Steuerung, keine echte Medienverbindung).
- **Rate-Limiting ist In-Memory** (pro Instanz). Für Multi-Instance-Setups ist ein Redis-Backend vorzusehen.
- **Storage-Adapter `db`** speichert Dateien (max. 10 MB) in PostgreSQL – ideal für Demo/MVP; für große Volumina ist ein Objekt-Storage-Treiber vorbereitet (siehe `docs/integrations.md`).
- **GoBD/DSGVO:** Die Plattform ist technisch darauf vorbereitet (Audit-Log, Tenant-Isolation, Lösch-/Export-Konzepte dokumentiert), ersetzt aber keine rechtliche Prüfung. Es werden bewusst keine Aussagen wie „GoBD-konform" oder „rechtssicher" getroffen.
- **Zwei-Faktor-Authentifizierung** ist vorbereitet (dokumentiert), im MVP noch nicht aktiv.

---

## Architektur & Dokumentation

- [`docs/architecture.md`](docs/architecture.md) – Systemarchitektur, Adapter, Auth-Design
- [`docs/data-model.md`](docs/data-model.md) – Datenmodell & Beziehungen
- [`docs/permissions.md`](docs/permissions.md) – Rollen und Berechtigungsmatrix
- [`docs/security.md`](docs/security.md) – Sicherheit, DSGVO/GoBD-Vorbereitung
- [`docs/integrations.md`](docs/integrations.md) – Adapter-Schnittstellen
- [`docs/deployment.md`](docs/deployment.md) – Vercel-Setup
- [`docs/demo-accounts.md`](docs/demo-accounts.md) – Demo-Zugänge
- [`docs/product-roadmap.md`](docs/product-roadmap.md) – Phasen & Roadmap

---

## Tech-Stack

Next.js 15 (App Router) · React 19 · JavaScript (bewusst ohne TypeScript) · Tailwind CSS v4 · Radix-Primitives · Prisma 6 · PostgreSQL (Neon-kompatibel) · TanStack Table · React Hook Form + Zod · Recharts · Lucide · Vitest · Playwright · GitHub Actions · Vercel

---

## Lizenz

Proprietär – alle Rechte vorbehalten.

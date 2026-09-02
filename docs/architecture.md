# Architektur

## Übersicht

```text
┌────────────────────────────────────────────────────────────────────┐
│                        Vercel (Region EU)                          │
│                                                                    │
│  ┌──────────────────┐        ┌───────────────────────────────┐    │
│  │  apps/landing    │        │          apps/app             │    │
│  │  Marketing-SSR   │        │  Next.js App Router (SSR)     │    │
│  │  (statisch)      │        │                               │    │
│  └──────────────────┘        │  ┌─────────────────────────┐  │    │
│                              │  │ Server Components       │  │    │
│        Login-Redirect ───────┼─▶│ Server Actions          │  │    │
│                              │  │ Route Handlers (API)    │  │    │
│                              │  └───────────┬─────────────┘  │    │
│                              │              │                │    │
│                              │  ┌───────────▼─────────────┐  │    │
│                              │  │ lib/: auth, guards,     │  │    │
│                              │  │ permissions, audit,     │  │    │
│                              │  │ adapters (email, video, │  │    │
│                              │  │ ai, storage, datev)     │  │    │
│                              │  └───────────┬─────────────┘  │    │
│                              └──────────────┼────────────────┘    │
│                                             │ Prisma              │
│                              ┌──────────────▼─────────────┐       │
│                              │  PostgreSQL (Neon, EU)     │       │
│                              │  Daten + Datei-Storage (db)│       │
│                              └────────────────────────────┘       │
└────────────────────────────────────────────────────────────────────┘
```

## Monorepo

```text
steuerberaterflow/
├── apps/
│   ├── app/       # SaaS-Anwendung (Next.js 15, App Router)
│   └── landing/   # Marketing-Landingpage (eigenständig, eigene Domain)
├── packages/
│   ├── ui/          # Design-System: Primitives + Radix-Overlays
│   ├── config/      # ESLint-Preset, Tailwind-v4-Theme, Produktkonstanten
│   └── validation/  # Zod-Schemas (von Actions und Formularen geteilt)
├── e2e/             # Playwright-Specs
└── docs/
```

## Routing (apps/app)

| Route-Gruppe | Zweck | Guard |
| --- | --- | --- |
| `/login`, `/invite/[token]` | Auth | öffentlich |
| `/(app)/*` | Kanzlei-Bereiche (Dashboard, Mandanten, Dokumente, …) | Rolle OWNER/STAFF/ACCOUNTANT |
| `/portal/*` | Mandantenportal | Rolle CLIENT (gebunden an `Client.portalUserId`) |
| `/admin/*` | Plattform-Administration | `User.isPlatformAdmin` |
| `/api/documents/[id]/file` | Geschützter Download/Preview | Session + Tenant + Aktenzugehörigkeit |
| `/meeting/[id]` | Demo-Meetingraum | Demo, ohne Medienübertragung |

Guard-Kette: `middleware.js` (nur Cookie-Präsenz) → `lib/context.js` (`requireFirmContext`, `requireClientContext`, `requirePlatformAdmin`) → serverseitige Queries mit `organizationId` aus der **Session** (nie aus Client-Input).

## Authentifizierung

- Passwort-Hashing: `scrypt` (node:crypto), Format `scrypt$N$r$p$salt$hash`, saliniert pro Benutzer.
- Sessions: zufälliges 32-Byte-Token im HttpOnly-Cookie (`sf_session`), in der DB nur der SHA-256-Hash (`Session.tokenHash`), Ablauf 7 Tage, serverseitig widerrufbar („Aktive Sitzungen").
- Aktive Organisation: Cookie `sf_org`; Membership-Tabelle verbindet User ↔ Organization ↔ Role.
- Einladungen: Single-Use-Token (24 Byte base64url), 7 Tage gültig, Status-Lebenszyklus inkl. Widerruf.

## Autorisierung

- Zentrale, reine Berechtigungsmatrix in `lib/permissions.js` (36 Permissions × 4 Rollen).
- Laufzeit-Guards: `guard(permission)` für Kanzlei-Actions, `guardPortal(permission)` für Mandanten-Actions.
- Defense-in-Depth: `belongsToOrg`/`assertOrgEntity` prüfen zusätzlich die Entitätszugehörigkeit.
- Externe Buchhalter (ACCOUNTANT) sehen nur ihnen zugewiesene Mandanten (Query-Filter über `ClientAssignment`).

## Tenant-Isolation

1. Jede tenantbezogene Tabelle hat `organizationId`.
2. Alle Queries filtern/scope auf `organizationId` aus der Session-Membership.
3. Mutationen adressieren Datensätze immer mit `where: { id, organizationId }`.
4. Downloads: Route-Handler prüft Session → Organization → bei CLIENT-Rolle zusätzlich `Client.portalUserId`.
5. E2E-Tests verifizieren Cross-Tenant-Zugriffe als verweigert (403).

## Adapter-Schicht (lib/adapters)

| Adapter | Mit Konfiguration | Ohne Konfiguration |
| --- | --- | --- |
| `email` | Resend REST API | Strukturiertes Logging + Portal-Benachrichtigung (Demo-Modus) |
| `video` | Daily REST API (vorbereitet) | Demo-Meetingraum (simulierte Steuerung, klar gekennzeichnet) |
| `ai` | OpenAI (Zusammenfassungen) | Heuristischer Mock-Modus; alle Ausgaben `isDraft: true` |
| `storage` | `db` (aktiv) / Supabase (vorbereitet) | – |
| `datev` | CSV-Export (aktiv) | – |
| `stripe` | Phase 3 (inaktiv) | – |

## Server Actions & Datenfluss

- Alle Mutationen laufen über Server Actions (`src/actions/*`), die mit `guard()` beginnen, Zod validieren, `revalidatePath()` aufrufen und `logAudit()` schreiben.
- Benachrichtigungen entstehen synchron in der Action (`createNotification`/`notifyOrgMembers`) – MVP ohne Hintergrund-Worker; E-Mail-/Queue-Versand ist als Adapter-Abstraktion vorbereitet.
- Uploads: `FormData` mit bis zu 12 MB (Server-Action-Limit konfiguriert), App-Limit 10 MB, Mime/Extension-Cross-Check, SHA-256-Prüfsumme, Duplikat-Hinweis.

## Design-System

Gemeinsame Tokens (`packages/config/theme.css`, Tailwind v4 `@theme`): warme Fläche `#F6F7F5`, Karten weiß, Primär `#176B4D`, feine Borders `#E2E7E3`, kompakte Dichte, kleine Schatten. Primitives in `packages/ui` werden von beiden Apps genutzt; Landingpage bleibt inhaltlich und technisch getrennt.

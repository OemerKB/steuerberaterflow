# Sicherheit & Datenschutz

## Umgesetzt (technisch verifizierbar)

### Authentifizierung & Sessions
- Passwort-Hashing mit `scrypt` (N=16384, r=8, p=1), 16-Byte-Salt pro Benutzer, `timingSafeEqual`-Vergleich.
- Session-Token (32 Byte Zufall) nur im HttpOnly-Cookie (`SameSite=Lax`, `Secure` in Produktion); DB speichert ausschließlich den SHA-256-Hash.
- Session-Widerruf pro Gerät („Aktive Sitzungen"), Ablauf nach 7 Tagen.
- Rate-Limiting für Login (30 Versuche / 5 min / IP) und Uploads (30 / min / Benutzer) sowie Portal-Nachrichten.

### Tenant-Isolation
- Jede tenantbezogene Tabelle trägt `organizationId`; alle Queries und Mutations scope auf die Session-Organisation.
- Defense-in-Depth: `assertOrgEntity` verifiziert Entitätszugehörigkeit vor Mutationen.
- Datei-Downloads ausschließlich über autorisierten Route-Handler (keine öffentlichen URLs), jede Anfrage/Verweigerung wird protokolliert.
- E2E-Tests verifizieren: fremdes Dokument → 403, Rollen-Routing (Mandant ⇄ Kanzlei).

### Protokollierung
- `AuditLog` erfasst Anlegen/Ändern/Löschen, Statuswechsel, Uploads, Downloads (erlaubt + verweigert), Freigaben, Admin-Aktionen – mit Akteur, Zeitpunkt, Kontext-Json.
- Keine Lösch-API für Audit-Einträge; Aufbewahrung folgt dem unten stehenden Konzept.

### Eingabevalidierung
- Zod-Schemas in allen Server Actions (`packages/validation`).
- Upload-Härtung: Mime-Allowlist, Extension-Allowlist, Cross-Check Extension↔MIME (Anti-Tarnung), 10-MB-Limit, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`.
- SHA-256-Prüfsummen pro Version + Duplikat-Hinweise.

### Operationalisierung
- Keine Secrets im Repository (`.env` gitignored, `.env.example` dokumentiert).
- Strukturierte Fehlerbehandlung: Server Actions geben `{ error }`-Objekte zurück; keine sensiblen Daten in Client-Logs (E-Mail-Demo-Log enthält nur Metadaten).
- Feature Flags und Kanzlei-Sperrung im Adminbereich; Supportzugriff auf Kanzleien nur über protokollierte Aktionen.

## Konzeptionell vorbereitet (bis zur fachlichen Prüfung gekennzeichnet)

### DSGVO
- **EU-Hosting**: Deployment ist auf EU-Regionen (Vercel + Neon EU) ausgerichtet; vor produktivem Betrieb sind Auftragsverarbeitungsverträge (AVV) mit allen Dienstleistern abzuschließen.
- **Datenexport**: Mandantenakten sind über die UI vollständig einsehbar; ein maschinenlesbarer Gesamtexport (ZIP) ist als nächster Schritt vorgesehen (Roadmap).
- **Löschkonzept**: Org-Cascade löscht alle Kanzleidaten; einwirkbare Mandanten-Löschung mit Aufbewahrungsfristen (6/10 Jahre steuerrechtlich) erfordert eine fachliche Konfiguration – bewusst nicht automatisiert.
- **Einwilligungen**: Portaleinladung dokumentiert den Kontext; granulare Einwilligungs-Verwaltung ist Roadmap.

### GoBD
- Revisionsnahe Protokolle (Audit-Log ohne Lösch-API), unveränderliche Dokumentversionen mit Prüfsummen, konsistente Status-Workflows.
- **Kein Vollständigkeits-/Unveränderlichkeitsnachweis nach GoBD im rechtlichen Sinne** – die Plattform bereitet Nachvollziehbarkeit technisch vor; eine fachliche Prüfung (insb. Zertifizierung, Verfahrensdokumentation) steht aus. Wir treffen bewusst keine Aussage wie „GoBD-konform" oder „rechtssicher".

### Zwei-Faktor-Authentifizierung
- Session-Modell und Profilebene sind vorbereitet (zweiter Faktor als Session-Bindung); Aktivierung ist ein isolierter nächster Schritt.

## Bekannte Risiken / Grenzen

| Thema | Status | Nächster Schritt |
| --- | --- | --- |
| Rate-Limiting In-Memory | funktioniert pro Instanz | Redis-Backend für Multi-Instance |
| Datei-Storage in PostgreSQL | OK bis ca. 10 MB/Datei, Demo-/MVP-Volumina | Objekt-Storage (Supabase/S3) mit signierten URLs |
| E-Mail-Fallback Demo-Modus | transparent gekennzeichnet | Resend-Produktionssetup + SPF/DKIM |
| KI-Datenminimierung | Mock-Modus sendet nichts | Provider-DPA + Datenminimierung vor Aktivierung |

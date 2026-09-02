# Berechtigungen (Rollen & Permissions)

Die Laufzeit-Matrix liegt zentral in `apps/app/src/lib/permissions.js` (rein, unit-getestet). Der Katalog wird beim Seed zusätzlich in `Permission`/`RolePermission` dokumentiert.

## Rollen

| Rolle | Beschreibung | Scope |
| --- | --- | --- |
| `OWNER` (Kanzleiinhaber) | Volle Kontrolle inkl. Team, Einstellungen, Archivierung | gesamte Kanzlei |
| `STAFF` (Mitarbeiter) | Operativer Alltag: Mandanten, Dokumente, Aufgaben, Fristen, Freigaben | gesamte Kanzlei |
| `ACCOUNTANT` (Externer Buchhalter) | Eingeschränkt: nur zugewiesene Mandanten, keine Freigaben/Team/Protokoll | zugewiesene Mandanten |
| `CLIENT` (Mandant) | Nur Mandantenportal, gebunden an eine Akte (`Client.portalUserId`) | eigene Akte |
| Plattform-Admin (`User.isPlatformAdmin`) | Plattformverwaltung; Kanzleizugriff nur protokolliert (Sperre/Aktivierung) | plattformweit |

## Berechtigungsmatrix (Auszug)

| Permission | OWNER | STAFF | ACCOUNTANT | CLIENT |
| --- | :-: | :-: | :-: | :-: |
| clients.read | ✓ | ✓ | ✓ (nur zugewiesen) | – |
| clients.create / update | ✓ | ✓ | – | – |
| clients.archive | ✓ | – | – | – |
| clients.invite | ✓ | ✓ | – | – |
| documents.read / create | ✓ | ✓ | ✓ (nur zugewiesen) | – |
| documents.update / status | ✓ | ✓ | – | – |
| requests.read | ✓ | ✓ | ✓ | – |
| requests.manage | ✓ | ✓ | – | – |
| tasks.read / update | ✓ | ✓ | ✓ | – |
| tasks.create | ✓ | ✓ | – | – |
| deadlines.read / manage | ✓ | ✓ | – | – |
| messages.read / send | ✓ | ✓ | ✓ | – |
| appointments.read | ✓ | ✓ | ✓ | – |
| appointments.manage | ✓ | ✓ | – | – |
| approvals.read / request | ✓ | ✓ | – | – |
| reports.read / manage | ✓ | ✓ | – | – |
| team.manage | ✓ | – | – | – |
| settings.manage | ✓ | – | – | – |
| audit.view | ✓ | ✓ | – | – |
| portal.documents.upload | – | – | – | ✓ |
| portal.requests.read | – | – | – | ✓ |
| portal.tasks.read | – | – | – | ✓ |
| portal.messages.read / send | – | – | – | ✓ |
| portal.appointments.read / book | – | – | – | ✓ |
| portal.approvals.decide | – | – | – | ✓ |
| portal.reports.read | – | – | – | ✓ |

## Durchsetzung

1. **UI**: Navigation und Aktionen werden nach Rolle gerendert (`can()` in Layouts/Pages).
2. **Server Actions**: Jede Action beginnt mit `guard(permission)` bzw. `guardPortal(permission)` – wirft `FORBIDDEN` bei Fehlen.
3. **Queries**: Organisations-Scope kommt ausschließlich aus der Session; ACCOUNTANT zusätzlich gefiltert auf `ClientAssignment`.
4. **Dateien**: Route-Handler prüft Session + Organization + (bei CLIENT) Aktenzugehörigkeit; jede Entscheidung wird protokolliert.
5. **Interne Notizen**: `Conversation.type = INTERNAL` und `Message.isInternal` werden in Portal-Queries serverseitig ausgeschlossen.

## Tests

- `apps/app/tests/permissions.test.js` prüft die Matrix (inkl. Verweigerungen) und die `FORBIDDEN`-Signatur.
- `e2e/isolation.spec.js` verifiziert Rollen-Routing (Mandant ⇄ Kanzlei) und Cross-Tenant-Downloads.

# Datenmodell

Alle tenantbezogenen Modelle tragen `organizationId` (Tenant-Isolation auf DB-Ebene). Löschstrategie: Organisationen löschen kaskadiert alle zugehörigen Daten (Prisma `onDelete: Cascade`); Querverweise zwischen Mandantenobjekten werden restriktiv oder auf `SetNull` behandelt.

## Kernmodelle

### Organisation & Benutzer
| Modell | Zweck | Wichtige Felder/Beziehungen |
| --- | --- | --- |
| `Organization` | Kanzlei/Mandantenverbund | `slug` (unique), `status` (ACTIVE/SUSPENDED) |
| `OrganizationSettings` | Branding, Adresse, Zeitzone, KI-Flags | 1:1 zur Organization |
| `User` | Benutzerkonto | `email` (unique), `passwordHash`, `isPlatformAdmin`, `isActive` |
| `Membership` | User ↔ Organization + Rolle | unique `(organizationId, userId)`, `Role` |
| `Permission` / `RolePermission` | Berechtigungskatalog (Dokumentation der Matrix) | Seed schreibt die Laufzeit-Matrix aus `lib/permissions.js` |
| `Session` | DB-Sessions | `tokenHash` (unique), `expiresAt` |
| `Invitation` | Einladungen (Team & Mandanten) | `token` (unique), `role`, `clientId?`, Status inkl. Widerruf |

### Mandanten
| Modell | Zweck |
| --- | --- |
| `Client` | Mandantenakte: Rechtsform, Steuernummer, Steuerarten, Status, `responsibleUserId`, `portalUserId` (unique, Portal-Login) |
| `ClientContact` | Ansprechpartner (primär markierbar) |
| `ClientAssignment` | n:m User(Membership) ↔ Client für externe Buchhalter |
| `ClientNote` | Interne Notizen zur Akte |

### Dokumente & Belege
| Modell | Zweck |
| --- | --- |
| `Document` | Metadaten: `DocumentCategory` (12 Werte), `DocumentStatus` (7 Werte), Steuerjahr/Monat, Tags |
| `DocumentVersion` | Dateiinhalt (`Bytes`), `mimeType`, `sizeBytes`, SHA-256-`checksum`, Versionierung |
| `DocumentComment` | Kommentare (intern markierbar) |
| `DocumentRequest` | Unterlagenpaket („Monatsbuchhaltung August 2026") mit Status |
| `RequestItem` | Einzelne angeforderte Unterlage: MISSING → UPLOADED → ACCEPTED / WAIVED, optional verknüpftes Dokument |

### Workflow
| Modell | Zweck |
| --- | --- |
| `Task` / `TaskChecklistItem` | Aufgaben mit 6 Statuswerten, 4 Prioritäten, Checklisten |
| `Deadline` | Fristen mit `Recurrence` (MONTHLY/QUARTERLY/YEARLY), Erinnerungsintervall, Verknüpfung zu Mandant/Dokument |
| `Conversation` / `Message` / `MessageRead` | Nachrichten: `type` CLIENT/INTERNAL (interne Notizen niemals für Mandanten), Unread-Tracking |
| `Appointment` / `MeetingRoom` | Termine (6 Typen, 4 Status) mit Meetingraum (Provider-Angabe, `isDemo`) |
| `ApprovalRequest` / `ApprovalDecision` | Freigaben: PENDING → APPROVED/REJECTED/CHANGES, jede Entscheidung protokolliert |
| `Report` | Auswertungen/Hinweise mit `data` (Json, Chartdaten) und `isDemoData`-Kennzeichnung |

### System
| Modell | Zweck |
| --- | --- |
| `Notification` | Benutzer-Benachrichtigungen mit Link |
| `AuditLog` | Revisionsnahe Protokolle (optional org-/user-bezogen, Json-Metadaten) |
| `Subscription` | Tarif (SOLO/KANZLEI/PRO), Status, Seats |
| `FeatureFlag` | Globale Feature-Schalter |
| `SupportCase` | Plattform-Supportfälle |

## Status-Enums (Auszug)

- `DocumentStatus`: NEW → ANALYZING → REVIEW → QUESTION → ACCEPTED / REJECTED → ARCHIVED
- `TaskStatus`: OPEN, IN_PROGRESS, WAITING_CLIENT, WAITING_FIRM, DONE, ARCHIVED (Übergänge in `lib/workflow.js` bewacht)
- `DeadlineStatus`: PLANNED, IN_PROGRESS, DONE, MISSED
- `RequestItemStatus`: MISSING, UPLOADED, ACCEPTED, WAIVED
- `ApprovalRequestStatus`: PENDING, APPROVED, REJECTED, CHANGES
- `AppointmentStatus`: REQUESTED, CONFIRMED, CANCELLED, COMPLETED

## Indizes

Alle häufigen Abfragen sind abgedeckt, z. B.:
- `(organizationId, status)` auf Client, Document, Task, Deadline, ApprovalRequest
- `(organizationId, dueDate)` auf Deadline, `(organizationId, startsAt)` auf Appointment
- `(assigneeId, status)` auf Task, `(clientId)` auf Dokumente/Tasks/Fristen/Konversationen
- `(conversationId, createdAt)` auf Message, unique `(conversationId, userId)` auf MessageRead

## Löschstrategien

- `Organization` → Cascade auf alle Kanzleidaten.
- `Client` → Cascade auf Akteninhalte; Dokumente behalten `organizationId` für Audit-Rückverfolgung.
- `User` → Cascade auf Sessions/Memberships; Fachobjekte (Tasks etc.) mit `SetNull` auf Verantwortlichkeitsfeldern, damit Historie erhalten bleibt.
- `DocumentVersion` → kaskadiert mit Dokument; Prüfung `uploadedById` als `SetNull` (Mandanten-Uploads ohne Kanzlei-User).

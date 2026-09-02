# Demo-Konten (nur für Demo-Umgebungen!)

Nach `npm run db:seed` stehen folgende Konten bereit. **Passwort für alle: `demo1234!`**

## Kanzlei „Faber & Partner Steuerberatung"

| Rolle | E-Mail | Was man sieht |
| --- | --- | --- |
| Kanzleiinhaberin | `julia.faber@faber-partner.demo` | Volle Kanzleiansicht inkl. Team, Einstellungen, Archivierung |
| Steuerberater | `daniel.weber@faber-partner.demo` | Operative Sicht (keine Team-/Einstellungsverwaltung) |
| Sachbearbeiterin (extern) | `lisa.koenig@faber-partner.demo` | Nur ihr zugewiesene Mandanten, eingeschränkte Aktionen |
| Plattform-Admin | `admin@steuerberaterflow.demo` | Plattform-Administration (`/admin`) |

## Mandantenportal

| Mandant | E-Mail | Typ |
| --- | --- | --- |
| Nordstern Bau GmbH | `mandant@nordstern-bau.demo` | GmbH (primärer Demo-Mandant) |
| Kaya Immobilienverwaltung | `mandant@kaya.demo` | Vermieter |
| Studio Form GmbH | `mandant@studio-form.demo` | GmbH |
| Café Morgenrot | `mandant@cafe-morgenrot.demo` | Einzelunternehmen |
| Lena Hoffmann Fotografie | `mandant@lena-hoffmann.demo` | Freiberuflerin |
| Grünwerk Landschaftsbau | `mandant@gruenwerk.demo` | Einzelunternehmen |

## Was die Demo zeigt

- **Kanzlei-Seite**: Dashboard mit Live-Kennzahlen, Mandanten mit Bearbeitungsstatus, Onboarding-Wizard, Dokumente mit Vorschau/Versionen, fehlende Unterlagen („Monatsbuchhaltung August 2026" – 2 von 5 fehlen), Aufgaben-Kanban, Fristen (Liste + Kalender), interne + Mandanten-Nachrichten, Termine mit Demo-Meetingraum, Freigaben, Auswertungen (Beispieldaten), Aktivitätsprotokoll.
- **Portal-Seite**: „Das ist jetzt zu erledigen", fehlende Unterlagen mit Direkt-Upload pro Position, eigene Dokumente, Nachrichten an die Kanzlei, Terminbuchung über Zeitfenster, Freigaben erteilen, Auswertungen.

## Sicherheitshinweise

- Konten ausschließlich in Demo-/Testumgebungen verwenden.
- Vor produktivem Betrieb: alle Demo-Konten deaktivieren oder Passwörter rotieren, `AUTH_SECRET` neu setzen, echte Benutzer per Einladung anlegen.
- Keine echten personenbezogenen Daten im Seed – alle Namen/IBAN-ähnlichen Angaben sind fiktiv.

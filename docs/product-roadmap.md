# Produkt-Roadmap

## Phase 1 – MVP (implementiert, vollständig funktionsfähig)

- ✅ Authentifizierung (scrypt, DB-Sessions, Einladungsflow, Rate-Limiting)
- ✅ Multi-Tenant-Architektur mit serverseitiger Tenant-Isolation (getestet)
- ✅ Rollen und Berechtigungen (OWNER/STAFF/ACCOUNTANT/CLIENT + Plattform-Admin)
- ✅ Kanzlei-Dashboard mit Live-Kennzahlen und Quick Actions
- ✅ Mandantenverwaltung (Tabelle mit Suche/Filter/CSV/Archivierung)
- ✅ Digitale Mandantenakte (12 Tabs) + geführtes Onboarding
- ✅ Dokumenten- & Beleg-Flow (Upload, Versionen, Status, geschützte Downloads)
- ✅ Fehlende Unterlagen (Pakete, Erinnerungs-Queue-Abstraktion)
- ✅ Aufgaben (Liste/Kanban) und Fristen (Liste/Kalender, Wiederholungen)
- ✅ Sichere Nachrichten inkl. interner Kanzleinotizen
- ✅ Mandantenportal (mobil-first)
- ✅ Demo-Daten (Faber & Partner) + Landingpage
- ✅ Tests (47 Unit/Integration + 8 E2E) und CI
- ✅ Deployment auf Vercel (App + Landing)

## Phase 2 – funktionsfähige Basis / Demo-Modus (implementiert)

- ✅ Terminbuchung mit Zeitfenstern
- ✅ Meetingraum (Demo-Modus; Provider-Adapter vorbereitet)
- ✅ Bildschirmfreigabe-UI (simuliert, gekennzeichnet)
- ✅ FreigabeFlow mit Audit-Eintrag
- ✅ Beispielauswertungen mit Charts (klar gekennzeichnet)
- ✅ KI-Assistent (Mock-Modus; OpenAI-Adapter für Zusammenfassungen vorbereitet)
- ✅ Benachrichtigungen (In-App; E-Mail als Adapter)
- ✅ DATEV-Export als CSV-Vorbereitung

## Phase 3 – Roadmap (dokumentiert, nicht implementiert)

- Offizielle DATEV-Integration (Zertifizierung, ELSTER-Anbindung prüfen)
- Banking-Anbindung (Kontoumsätze, Zahlungsverkehr)
- Automatische OCR-Verarbeitung (Belegtexterkennung → Metadaten)
- Qualifizierte elektronische Signatur (Provider-Schnittstelle, z. B. für Vollmachten/Freigaben)
- Kalender-Synchronisierung (Google/Outlook, ICS)
- Mandanten-App (React Native)
- Erweiterte Kanzleiauswertungen (Umsatz je Mandant, Bearbeitungszeiten)
- White Label (Domain, Farben, Logo je Kanzlei)
- Abrechnung über Stripe (Abos, Seats, Dunning)
- Zwei-Faktor-Authentifizierung aktivieren
- Objekt-Storage (Supabase/S3) für große Dokumentvolumina
- Redis-Rate-Limiting für Multi-Instance-Betrieb
- Maschinenlesbarer Mandanten-Datenexport (DSGVO Art. 20 Vorbereitung)

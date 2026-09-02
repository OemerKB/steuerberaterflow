import {
  FileQuestion, FolderOpen, ListTodo, CalendarClock, MessagesSquare, Video,
  Users, CheckCheck, BarChart3, ShieldCheck, Lock, Server, FileSearch,
  ArrowRight, Sparkles, FileDown, Repeat, CalendarCheck, Smartphone,
} from "lucide-react";
import { Logo, APP_URL } from "./logo";

function Section({ id, eyebrow, title, text, children, className = "" }) {
  return (
    <section id={id} className={`py-16 lg:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {text ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{text}</p> : null}
        {children}
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/70 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}

/* --------------------------------- Sektionen -------------------------------- */

function TrustBar() {
  return (
    <div className="border-y border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-xs font-medium text-muted sm:px-6">
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> EU-Hosting (Konzept)</span>
        <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> Tenant-isolierte Datenhaltung</span>
        <span className="flex items-center gap-1.5"><FileSearch className="h-4 w-4 text-primary" /> Revisionsnahe Protokolle</span>
        <span className="flex items-center gap-1.5"><Server className="h-4 w-4 text-primary" /> DSGVO-orientierte Architektur</span>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <Section
      id="problem"
      eyebrow="Das Problem heute"
      title="Kanzleikommunikation verläuft sich in E-Mails, Ordnern und Anrufen"
      text="Belege liegen in mehreren Postfächern, Unterlagenanforderungen werden mündlich wiederholt, Fristen leben in Excel-Listen – und der Mandant sieht den Status seiner Steuern nicht."
    >
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { t: "Verteilte Belege", d: "E-Mail-Anhänge, WhatsApp-Fotos, USB-Sticks – ohne Struktur und ohne Protokoll." },
          { t: "Wiederholte Rückfragen", d: "„Haben Sie meine Belege schon?“ – Statusfragen kosten jeden Tag Zeit auf beiden Seiten." },
          { t: "Fristen in Kopf und Listen", d: "Kein gemeinsamer Überblick, was offen ist und wer handeln muss." },
        ].map((p) => (
          <div key={p.t} className="rounded-xl border border-border bg-danger-bg/40 p-5">
            <h3 className="text-sm font-semibold text-danger">{p.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PlatformOverview() {
  return (
    <Section
      id="produkt"
      eyebrow="Die Plattform"
      title="Ein zentraler Arbeitsplatz für Kanzlei und Mandant"
      text="SteuerberaterFlow ersetzt keine Buchhaltungs- oder DATEV-Software. Es ist die moderne, verständliche Kommunikations-, Dokumenten- und Workflow-Schicht dazwischen."
      className="bg-card border-y border-border"
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={FolderOpen} title="Digitale Mandantenakte" text="Alle Dokumente, Aufgaben, Fristen und Nachrichten eines Mandanten an einem Ort." />
        <FeatureCard icon={FileQuestion} title="Fehlende Unterlagen" text="Strukturierte Unterlagenpakete statt E-Mail-Ketten – der Mandant sieht exakt, was fehlt." />
        <FeatureCard icon={ListTodo} title="Aufgaben & Fristen" text="Team- und Mandantenaufgaben mit Checklisten, Prioritäten und Erinnerungen." />
        <FeatureCard icon={Video} title="Digitale Beratung" text="Termine mit Meetingraum, Notizen und Nachbereitungsaufgaben." />
      </div>
    </Section>
  );
}

function FeatureDeep() {
  return (
    <Section
      id="funktionen"
      eyebrow="Funktionen"
      title="Durchdachte Workflows für den Kanzleialltag"
    >
      <div className="mt-10 space-y-14">
        {/* BelegFlow */}
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FolderOpen className="h-5 w-5 text-primary" /> BelegFlow
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Drag-and-Drop-Upload mit Kategorien, Steuerjahr, Monat und Tags. Status von „Neu" über
              „Rückfrage" bis „Akzeptiert" – inklusive Versionen, Kommentaren und Prüfsummen.
              Duplikat-Hinweise und Metadaten-Vorschläge der KI-Assistenz sind immer nur Entwürfe.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
            <div className="space-y-2">
              {[
                { n: "Eingangsrechnung Baustoff-Händler", s: "Zu prüfen", tone: "bg-warning-bg text-warning" },
                { n: "Kontoauszug Juli 2026", s: "Akzeptiert", tone: "bg-accent text-accent-foreground" },
                { n: "Kassenbericht August", s: "Neu", tone: "bg-info-bg text-info" },
              ].map((d) => (
                <div key={d.n} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-xs font-medium">{d.n}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${d.tone}`}>{d.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fehlende Unterlagen */}
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Monatsbuchhaltung August 2026</p>
              <span className="rounded bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning">2 von 5 fehlen</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {[
                { t: "Kontoauszug Geschäftskonto", ok: true },
                { t: "Kreditkartenabrechnung", ok: true },
                { t: "Eingangsrechnungen", ok: true },
                { t: "Kassenbericht", ok: false },
                { t: "Bewirtungsbelege", ok: false },
              ].map((i) => (
                <div key={i.t} className="flex items-center gap-2 rounded-md border border-border/80 px-2 py-1.5">
                  <span className={`h-2 w-2 rounded-full ${i.ok ? "bg-primary" : "bg-danger"}`} />
                  <span className={`text-xs ${i.ok ? "text-muted" : "font-medium text-foreground"}`}>{i.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FileQuestion className="h-5 w-5 text-primary" /> Fehlende Unterlagen
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Kanzleimitarbeiter erstellen Unterlagenpakete wie „Monatsbuchhaltung August 2026".
              Der Mandant sieht im Portal klar: „Für August fehlen noch 2 von 5 Unterlagen" – und lädt
              die Datei direkt an der passenden Stelle hoch. Erinnerungen sind als Demo-/Queue-Abstraktion
              vorbereitet; echter E-Mail-Versand nur bei Konfiguration.
            </p>
          </div>
        </div>

        {/* Aufgaben & Fristen */}
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <ListTodo className="h-5 w-5 text-primary" /> Aufgaben &amp; Fristen
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Aufgaben für Team und Mandanten – als Liste oder Kanban, mit Checklisten und
              Zuständigkeiten. Fristen mit Wiederholungen, Kalender- und Listenansicht.
              Wichtig: Fristen sind Vorlagen und Erinnerungen – keine rechtsverbindliche
              Fristautomatik.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
            <div className="grid grid-cols-3 gap-2">
              {["Offen", "In Bearbeitung", "Wartet auf Mandant"].map((c) => (
                <div key={c} className="rounded-lg bg-background/70 p-2">
                  <p className="text-[10px] font-semibold text-muted">{c}</p>
                  <div className="mt-1.5 space-y-1">
                    {c === "Offen" ? ["UST VA August", "Belege vervollständigen"] : c === "In Bearbeitung" ? ["Jahresabschluss 2025"] : ["Rückfrage KK-Beleg"].map((t) => (
                      <div key={t} className="rounded-md border border-border bg-card px-1.5 py-1 text-[10px] font-medium">{t}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Beratung */}
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
            <div className="flex h-40 items-center justify-center rounded-lg bg-foreground/90">
              <div className="text-center text-white/80">
                <Video className="mx-auto h-8 w-8" />
                <p className="mt-2 text-xs">Demo-Meetingraum · Kamera, Mikrofon, Bildschirmfreigabe</p>
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] text-muted">
              Ohne konfigurierten Video-Provider wird ein klar gekennzeichneter Demo-Raum genutzt.
            </p>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Video className="h-5 w-5 text-primary" /> Beratung mit Video &amp; Bildschirmfreigabe
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Terminarten vom Erstgespräch bis zur BWA-Besprechung, Buchung über freie Zeitfenster,
              Erinnerung an beide Seiten. Der Meetingraum wird über eine Provider-Abstraktion
              angebunden (Daily, LiveKit u. a.) – die Integration ist vorbereitet und dokumentiert.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function FirmSection() {
  return (
    <Section
      id="kanzleien"
      eyebrow="Für Kanzleien"
      title="Sichtbarkeit statt Nachfragen"
      text="Das Kanzlei-Dashboard bündelt Kennzahlen und die nächsten Schritte – aus echten Daten, nicht aus Deko-Zahlen."
      className="bg-card border-y border-border"
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={Users} title="Mandantenübersicht" text="Suche, Filter, gespeicherte Ansichten, CSV-Export und verständlicher Bearbeitungsstatus je Akte." />
        <FeatureCard icon={CheckCheck} title="FreigabeFlow" text="Dokumente und Ergebnisse zur Kenntnis oder Freigabe senden – mit Audit-Eintrag. Keine qualifizierte elektronische Signatur." />
        <FeatureCard icon={BarChart3} title="Verständliche Auswertungen" text="Einnahmen, Ausgaben, Kostenblöcke – klar aufbereitet, deutlich als Beispieldaten gekennzeichnet." />
        <FeatureCard icon={FileDown} title="DATEV-Vorbereitung" text="CSV-/ZIP-Export als saubere Grundlage – keine vorgetäuschte offizielle DATEV-Verbindung." />
      </div>
    </Section>
  );
}

function PortalSection() {
  return (
    <Section
      id="portal"
      eyebrow="Mandantenportal"
      title="„Was muss ich tun?“ – auf einen Blick beantwortet"
      text="Das Portal ist bewusst einfach: fehlende Unterlagen, offene Aufgaben, nächste Termine, Freigaben und Nachrichten – mobil perfekt nutzbar."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={Smartphone} title="Mobil first" text="Uploads per Kamera, klare Checklisten, große Zielflächen." />
        <FeatureCard icon={CalendarCheck} title="Termin buchen" text="Freie Zeitfenster wählen, Beratungsart angeben – die Kanzlei bestätigt." />
        <FeatureCard icon={CheckCheck} title="Freigaben" text="Dokument ansehen und mit einem Klick bestätigen oder Rückfrage stellen." />
        <FeatureCard icon={MessagesSquare} title="Sicher chatten" text="Nachrichten mit der Kanzlei – interne Kanzleinotizen bleiben unsichtbar." />
      </div>
    </Section>
  );
}

function SecuritySection() {
  return (
    <Section
      id="sicherheit"
      eyebrow="Sicherheit & Datenschutz"
      title="Sicherheit als Architektur, nicht als Versprechen"
      text="Wir beschreiben, was technisch umgesetzt ist – und kennzeichnen offen, was Vorbereitung bis zur fachlichen Prüfung ist."
      className="bg-card border-y border-border"
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={Lock} title="Tenant-Isolation" text="Jede Abfrage, jeder Action und jede Datei ist serverseitig auf die eigene Kanzlei beschränkt – getestet." />
        <FeatureCard icon={FileSearch} title="Audit-Log" text="Revisionsnahe Protokollierung von Zugriffen und Änderungen als GoBD-Vorbereitung." />
        <FeatureCard icon={ShieldCheck} title="Geschützte Downloads" text="Zeitlich begrenzte, autorisierte Datei-URLs ohne öffentliche Buckets." />
        <FeatureCard icon={Server} title="EU-Hosting (Konzept)" text="Deployment auf EU-Datenbanken vorbereitet; Auftragsverarbeitung vor Kontraktualisierung." />
      </div>
      <p className="mt-6 rounded-lg border border-border bg-background/60 p-4 text-xs leading-relaxed text-muted">
        Hinweis: SteuerberaterFlow beschreibt Datenschutz- und GoBD-Funktionen als technische
        Vorbereitung. Aussagen wie „vollständig GoBD-konform" oder „rechtssicher" werden bewusst
        vermieden, bis eine fachliche und rechtliche Prüfung erfolgt ist.
      </p>
    </Section>
  );
}

function IntegrationsSection() {
  return (
    <Section
      id="integrationen"
      eyebrow="Integrationen"
      title="Austauschbare Adapter statt gefälschter Verbindungen"
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={FileDown} title="DATEV" text="CSV-/ZIP-Export als Vorbereitung – offizielle Integration folgt." />
        <FeatureCard icon={Sparkles} title="KI-Provider" text="Austauschbar; ohne API-Key läuft ein transparenter Mock-Modus." />
        <FeatureCard icon={Video} title="Video-Meetings" text="Daily/LiveKit-Abstraktion; Demo-Raum ohne Konfiguration." />
        <FeatureCard icon={Repeat} title="E-Mail & Kalender" text="Resend-Adapter vorbereitet; Kalender-Sync auf der Roadmap." />
      </div>
    </Section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Solo",
      price: "79 €",
      period: "pro Monat",
      blurb: "Für selbstständige Steuerberater und kleine Kanzleien.",
      features: ["1 Kanzleibenutzer", "bis 50 Mandanten", "Dokumentenportal", "Aufgaben und Fristen", "Nachrichten"],
    },
    {
      name: "Kanzlei",
      price: "249 €",
      period: "pro Monat",
      blurb: "Für Kanzleien mit Team und regelmäßiger Mandantenberatung.",
      highlight: true,
      features: ["bis 10 Mitarbeiter", "bis 500 Mandanten", "Video-Beratung", "Freigaben", "Automatisierungen", "Auswertungen"],
    },
    {
      name: "Pro",
      price: "individuell",
      period: "",
      blurb: "Für größere Kanzleien mit besonderen Anforderungen.",
      features: ["individuelle Nutzung", "White Label", "API", "individuelles Onboarding", "priorisierter Support", "individuelle Integrationen"],
    },
  ];
  return (
    <Section
      id="preise"
      eyebrow="Preise"
      title="Vorläufige Produktpreise"
      text="Preise sind vorläufige Produktpreise und noch kein verbindliches Angebot."
      className="bg-card border-y border-border"
    >
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-xl border p-6 ${
              p.highlight ? "border-primary shadow-(--shadow-pop) bg-card" : "border-border bg-card shadow-(--shadow-card)"
            }`}
          >
            {p.highlight ? (
              <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-white">
                Empfohlen
              </span>
            ) : null}
            <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
            <p className="mt-2">
              <span className="text-3xl font-semibold tracking-tight">{p.price}</span>
              {p.period ? <span className="ml-1 text-sm text-muted">{p.period}</span> : null}
            </p>
            <p className="mt-1.5 text-xs text-muted">{p.blurb}</p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={`${APP_URL}/login`}
              className={`mt-6 flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                p.highlight ? "bg-primary text-white hover:bg-primary-hover" : "border border-border text-foreground hover:bg-accent/40"
              }`}
            >
              Demo ansehen
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Ersetzt SteuerberaterFlow DATEV oder meine Buchhaltungssoftware?",
      a: "Nein. SteuerberaterFlow ist die Kommunikations-, Dokumenten- und Workflow-Ebene zwischen Kanzlei und Mandant. Für Buchung und Verprobung nutzen Sie weiterhin Ihre bestehende Software – wir liefern eine saubere Grundlage (z. B. CSV-Export).",
    },
    {
      q: "Werden steuerliche Fristen automatisch berechnet?",
      a: "Nein. Fristen werden als Vorlagen und Erinnerungen geführt. Eine rechtsverbindliche Fristautomatik gibt es im MVP nicht – Fristen werden durch die Kanzlei fachlich geprüft.",
    },
    {
      q: "Sind die KI-Funktionen eine Steuerberatung?",
      a: "Nein. KI-Ausgaben sind ausschließlich Entwürfe (z. B. Metadaten-Vorschläge), müssen bestätigt werden und ersetzen keine steuerliche Beratung. Ohne konfigurierten Provider läuft ein transparenter Mock-Modus.",
    },
    {
      q: "Ist die Bestätigung von Dokumenten eine qualifizierte elektronische Signatur?",
      a: "Nein. Die Freigabe dokumentiert die Kenntnisnahme im Portal. Für qualifizierte Signaturen ist eine Provider-Schnittstelle vorgesehen.",
    },
    {
      q: "Wo liegen die Daten?",
      a: "Die Plattform ist für EU-Hosting konzipiert und wird mit einer EU-Datenbank betrieben. Auftragsverarbeitungsverträge werden vor produktivem Kanzleibetrieb abgeschlossen.",
    },
    {
      q: "Wie startet meine Kanzlei?",
      a: "Mit der Demo: Ein Kanzleikonto und ein Mandantenkonto sind vorbereitet, damit Sie beide Perspektiven sofort erleben können.",
    },
  ];
  return (
    <Section id="faq" eyebrow="FAQ" title="Häufige Fragen">
      <div className="mt-8 space-y-3 max-w-3xl">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-xl border border-border bg-card p-5 open:shadow-(--shadow-card)">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">
              {f.q}
              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function FinalCTA() {
  return (
    <section className="border-y border-border bg-foreground py-16 text-white lg:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Bereit, die Verwaltung loszuwerden?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
          Erleben Sie beide Seiten: das Kanzlei-Dashboard und das Mandantenportal –
          mit vollständig vorbereiteten Demo-Daten.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href={`${APP_URL}/login`}
            className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Demo ansehen
          </a>
          <a
            href={`${APP_URL}/login`}
            className="inline-flex h-11 items-center rounded-lg border border-white/25 px-6 text-sm font-semibold text-white hover:bg-white/10"
          >
            Kostenlos testen
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-8 border-b border-border pb-8 md:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6" />
              SteuerberaterFlow
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Weniger Verwaltungsaufwand. Mehr Zeit für Beratung.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Produkt</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#produkt" className="text-muted hover:text-foreground">Plattform</a></li>
                <li><a href="#funktionen" className="text-muted hover:text-foreground">Funktionen</a></li>
                <li><a href="#preise" className="text-muted hover:text-foreground">Preise</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rechtliches</p>
              <ul className="mt-3 space-y-2 text-sm text-muted/70">
                <li>Impressum (Platzhalter)</li>
                <li>Datenschutz (Platzhalter)</li>
                <li>AVV (Platzhalter)</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kontakt</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href={`${APP_URL}/login`} className="text-muted hover:text-foreground">Login</a></li>
                <li><span className="text-muted/70">Demo anfragen (Platzhalter)</span></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} SteuerberaterFlow · Preise sind vorläufige Produktpreise.
        </p>
      </div>
    </footer>
  );
}

export {
  TrustBar, ProblemSection, PlatformOverview, FeatureDeep, FirmSection,
  PortalSection, SecuritySection, IntegrationsSection, Pricing, FAQ, FinalCTA, Footer,
};

import { Logo, APP_URL } from "./logo";

/**
 * Dashboard-Mockup als reines CSS/HTML – keine Stockfotos.
 * Zeigt: offene Unterlagen, bevorstehende Frist, Mandantenstatus.
 */
export function DashboardMockup() {
  return (
    <div className="relative rounded-xl border border-border bg-card shadow-(--shadow-pop) overflow-hidden text-left" aria-hidden="true">
      {/* Fensterleiste */}
      <div className="flex items-center gap-1.5 border-b border-border bg-background px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <div className="ml-3 flex items-center gap-1.5">
          <Logo className="h-4 w-4" />
          <span className="text-[10px] font-medium text-muted">SteuerberaterFlow · Kanzlei</span>
        </div>
      </div>

      <div className="grid grid-cols-[112px_1fr] sm:grid-cols-[140px_1fr]">
        {/* Sidebar */}
        <div className="border-r border-border bg-background/70 p-2.5 space-y-1">
          {["Übersicht", "Mandanten", "Dokumente", "Aufgaben", "Fristen", "Nachrichten"].map((item, i) => (
            <div
              key={item}
              className={`rounded-md px-2 py-1.5 text-[9px] sm:text-[10px] font-medium ${
                i === 0 ? "bg-accent text-accent-foreground" : "text-muted"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Inhalt */}
        <div className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-foreground">Heute wichtig</p>
              <p className="text-[8px] sm:text-[10px] text-muted">Mittwoch, 2. September 2026</p>
            </div>
            <span className="rounded-md bg-danger-bg px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold text-danger">3 kritisch</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { label: "Mandanten", value: "6" },
              { label: "Aufgaben", value: "5" },
              { label: "Fehlen", value: "7", tone: "text-warning" },
              { label: "Freigaben", value: "2" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-background/50 p-1.5 sm:p-2">
                <p className="text-[7px] sm:text-[8px] text-muted">{s.label}</p>
                <p className={`text-xs sm:text-sm font-semibold ${s.tone || "text-foreground"}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border p-2 sm:p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[8px] sm:text-[10px] font-semibold text-foreground">Fehlende Unterlagen</p>
              <span className="text-[8px] sm:text-[9px] text-primary font-medium">Alle →</span>
            </div>
            {[
              { name: "Nordstern Bau GmbH", req: "Monatsbuchhaltung 08/2026", miss: "2 von 5 fehlen" },
              { name: "Grünwerk Landschaftsbau", req: "Onboarding-Unterlagen", miss: "2 von 3 fehlen" },
            ].map((r) => (
              <div key={r.name} className="flex items-center justify-between gap-2 rounded-md border border-border/80 px-1.5 py-1 sm:px-2 sm:py-1.5">
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[10px] font-medium truncate">{r.name}</p>
                  <p className="text-[7px] sm:text-[9px] text-muted truncate">{r.req}</p>
                </div>
                <span className="shrink-0 rounded bg-warning-bg px-1 py-0.5 text-[7px] sm:text-[9px] font-medium text-warning">{r.miss}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-2 sm:p-3">
            <div>
              <p className="text-[8px] sm:text-[10px] font-semibold text-foreground">Bevorstehende Frist</p>
              <p className="text-[7px] sm:text-[9px] text-muted">Umsatzsteuervoranmeldung · Nordstern Bau GmbH</p>
            </div>
            <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[7px] sm:text-[9px] font-semibold text-accent-foreground">in 7 Tagen</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Die Zusammenarbeitsebene für Steuerkanzleien und Mandanten
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Weniger Verwaltungsaufwand.
            <br />
            <span className="text-primary">Mehr Zeit für Beratung.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
            SteuerberaterFlow verbindet Ihre Kanzlei und Mandanten in einem zentralen Portal
            für Unterlagen, Aufgaben, Fristen, Nachrichten und digitale Beratung.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={`${APP_URL}/login`}
              className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              Demo ansehen
            </a>
            <a
              href="#preise"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-accent/40 transition-colors"
            >
              Kostenlos testen
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">
            Demo-Zugänge vorhanden · läuft im Browser, keine Installation
          </p>
        </div>
        <DashboardMockup />
      </div>
    </section>
  );
}

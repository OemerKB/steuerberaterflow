import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { DemoAccounts } from "./demo-accounts";
import { Card, CardContent } from "@steuerberaterflow/ui";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }) {
  const session = await getSession();
  if (session) {
    if (session.membership?.role === "CLIENT") redirect("/portal");
    if (session.user.isPlatformAdmin && !session.membership) redirect("/admin");
    if (session.membership) redirect("/dashboard");
  }
  const params = await searchParams;

  return (
    <main id="main" className="min-h-screen flex">
      {/* Linke Seite – Markenbereich */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-foreground text-white p-10">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <LogoMark className="h-7 w-7" />
          SteuerberaterFlow
        </Link>
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Weniger Verwaltungsaufwand.<br />Mehr Zeit für Beratung.
          </h1>
          <p className="mt-4 text-white/70 text-sm max-w-sm leading-relaxed">
            Das digitale Portal für Unterlagen, Aufgaben, Fristen, Nachrichten und
            digitale Beratung – verbindlich strukturiert zwischen Kanzlei und Mandant.
          </p>
        </div>
        <p className="text-white/50 text-xs">© {new Date().getFullYear()} SteuerberaterFlow</p>
      </div>

      {/* Rechte Seite – Login */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center gap-2 font-semibold text-foreground mb-8 justify-center">
            <LogoMark className="h-6 w-6" />
            SteuerberaterFlow
          </Link>
          {params?.gesperrt ? (
            <div className="mb-4 rounded-lg bg-danger-bg text-danger text-sm px-4 py-3">
              Diese Kanzlei ist derzeit gesperrt. Bitte kontaktieren Sie den Support.
            </div>
          ) : null}
          {params?.error ? (
            <div className="mb-4 rounded-lg bg-warning-bg text-warning text-sm px-4 py-3">{params.error}</div>
          ) : null}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-lg font-semibold text-foreground">Anmelden</h2>
              <p className="text-sm text-muted mt-1 mb-5">Willkommen zurück – melden Sie sich an Ihrem Arbeitsplatz an.</p>
              <Suspense>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
          <Suspense>
            <DemoAccounts />
          </Suspense>
          <p className="text-center text-xs text-muted mt-6">
            Einladung erhalten?{" "}
            <Link href="/invite" className="sf-link">Einladung annehmen</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#176B4D" />
      <path d="M9 21.5L14 13l4 6 5-9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

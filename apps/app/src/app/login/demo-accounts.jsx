"use client";

import { useActionState, useEffect } from "react";
import { loginAction } from "@/actions/auth";
import { Card, CardContent, Button } from "@steuerberaterflow/ui";

const DEMO_ACCOUNTS = [
  {
    role: "Kanzleiinhaberin",
    email: "julia.faber@faber-partner.demo",
    password: "demo1234!",
    name: "Julia Faber",
    desc: "Volle Kanzleiansicht: Mandanten, Dokumente, Aufgaben, Fristen, Team & Einstellungen.",
  },
  {
    role: "Mandant",
    email: "mandant@nordstern-bau.demo",
    password: "demo1234!",
    name: "Nordstern Bau GmbH",
    desc: "Mandantenportal: Unterlagen hochladen, Aufgaben, Termine, Freigaben, Nachrichten.",
  },
];

/**
 * Demo-Zugänge (nur mit Demo-Datenbank verwendbar – siehe docs/demo-accounts.md).
 * Anmeldeformular wird mit Demo-Daten vorbelegt und direkt über den
 * regulären Login-Server-Action gesendet (keine Credentials in der URL).
 */
export function DemoAccounts() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <Card className="mt-4 border-dashed">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Demo-Zugänge</h3>
          <span className="text-[10px] uppercase tracking-wide bg-accent text-accent-foreground rounded px-1.5 py-0.5 font-semibold">
            Demo-Daten
          </span>
        </div>
        <form action={formAction} id="demo-login-form" className="mt-3 space-y-3">
          {DEMO_ACCOUNTS.map((acc) => (
            <div key={acc.email} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{acc.name}</p>
                  <p className="text-xs text-muted">{acc.role} · {acc.email}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  data-testid={`demo-login-${acc.email}`}
                  onClick={() => {
                    const form = document.getElementById("demo-login-form");
                    if (!form) return;
                    form.querySelector('[name="email"]').value = acc.email;
                    form.querySelector('[name="password"]').value = acc.password;
                    form.requestSubmit();
                  }}
                >
                  {pending ? "Anmeldung…" : "Anmelden"}
                </Button>
              </div>
              <p className="text-xs text-muted mt-1.5">{acc.desc}</p>
            </div>
          ))}
          <input type="hidden" name="email" />
          <input type="hidden" name="password" />
        </form>
        <p className="text-[11px] text-muted mt-3">
          Passwörter der Demo-Konten: <code className="bg-accent/60 rounded px-1">demo1234!</code> – nur für
          Demo-Umgebungen gedacht.
        </p>
        {state?.error ? <p className="text-xs text-danger mt-2">{state.error}</p> : null}
      </CardContent>
    </Card>
  );
}

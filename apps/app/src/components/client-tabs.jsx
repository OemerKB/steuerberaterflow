"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Übersicht" },
  { href: "/stammdaten", label: "Stammdaten" },
  { href: "/kontakte", label: "Ansprechpartner" },
  { href: "/dokumente", label: "Dokumente" },
  { href: "/belege", label: "Belege" },
  { href: "/aufgaben", label: "Aufgaben" },
  { href: "/fristen", label: "Fristen" },
  { href: "/nachrichten", label: "Nachrichten" },
  { href: "/termine", label: "Termine" },
  { href: "/freigaben", label: "Freigaben" },
  { href: "/notizen", label: "Notizen" },
  { href: "/aktivitaeten", label: "Aktivitäten" },
];

export function ClientTabs({ clientId }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border mb-5" aria-label="Mandantenakte">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = tab.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              active ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground hover:border-border"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo, APP_URL } from "./logo";

const NAV = [
  { href: "#produkt", label: "Produkt" },
  { href: "#funktionen", label: "Funktionen" },
  { href: "#kanzleien", label: "Für Kanzleien" },
  { href: "#sicherheit", label: "Sicherheit" },
  { href: "#preise", label: "Preise" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="#" className="flex items-center gap-2 font-semibold text-foreground">
          <Logo className="h-7 w-7" />
          SteuerberaterFlow
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Hauptnavigation">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-muted hover:text-foreground transition-colors">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href={`${APP_URL}/login`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Login
          </a>
          <a
            href={`${APP_URL}/login`}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Demo ansehen
          </a>
        </div>
        <button
          className="md:hidden p-2 rounded-lg hover:bg-accent/50"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>
      {open ? (
        <nav className="border-t border-border bg-card px-4 py-3 md:hidden" aria-label="Mobile Navigation">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted hover:text-foreground">
              {item.label}
            </a>
          ))}
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <a href={`${APP_URL}/login`} className="flex-1 text-center text-sm font-medium border border-border rounded-lg py-2">Login</a>
            <a href={`${APP_URL}/login`} className="flex-1 text-center text-sm font-medium bg-primary text-white rounded-lg py-2">Demo ansehen</a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

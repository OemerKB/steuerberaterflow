import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  title: "SteuerberaterFlow – Weniger Verwaltungsaufwand. Mehr Zeit für Beratung.",
  description:
    "SteuerberaterFlow verbindet Ihre Kanzlei und Mandanten in einem zentralen Portal für Unterlagen, Aufgaben, Fristen, Nachrichten und digitale Beratung.",
  openGraph: {
    title: "SteuerberaterFlow",
    description:
      "Das zentrale Portal für Unterlagen, Aufgaben, Fristen, Nachrichten und digitale Beratung zwischen Kanzlei und Mandant.",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  title: {
    default: "SteuerberaterFlow",
    template: "%s · SteuerberaterFlow",
  },
  description:
    "SteuerberaterFlow verbindet Ihre Kanzlei und Mandanten in einem zentralen Portal für Unterlagen, Aufgaben, Fristen, Nachrichten und digitale Beratung.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>
        <a href="#main" className="sf-skip-link">Zum Hauptinhalt springen</a>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

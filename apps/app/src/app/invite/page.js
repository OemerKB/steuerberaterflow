import Link from "next/link";
import { Card, CardContent } from "@steuerberaterflow/ui";

export const metadata = { title: "Einladung annehmen" };

export default function InviteLandingPage() {
  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6 text-center">
          <h1 className="text-lg font-semibold">Einladung annehmen</h1>
          <p className="mt-2 text-sm text-muted">
            Öffnen Sie den Einladungslink aus Ihrer E-Mail – er enthält Ihren persönlichen Einladungscode.
          </p>
          <form action="/invite" className="mt-5 flex gap-2" method="get">
            <input
              name="token"
              placeholder="Einladungscode (optional)"
              className="flex-1 h-9 rounded-lg border border-border px-3 text-sm focus:outline-2 focus:outline-primary"
            />
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover"
            >
              Weiter
            </button>
          </form>
          <p className="mt-4 text-xs text-muted">
            <Link href="/login" className="sf-link">Zur Anmeldung</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

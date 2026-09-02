import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/context";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Avatar, Button, FieldHint } from "@steuerberaterflow/ui";
import { ProfileForm } from "./profile-form";
import { endSessionAction } from "@/actions/settings";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Persönliche Einstellungen" };

export default async function ProfilePage() {
  const session = await requireSession();

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Persönliche Einstellungen" description="Profil, Passwort, Sprache und aktive Sitzungen." />

      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={session.user.name} size="lg" />
            <div>
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted">{session.user.email}</p>
            </div>
          </div>
          <ProfileForm user={session.user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aktive Sitzungen ({sessions.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm truncate">{s.userAgent || "Unbekanntes Gerät"}</p>
                <p className="text-[11px] text-muted">angemeldet {formatDateTime(s.createdAt)} · läuft ab {formatDateTime(s.expiresAt)}</p>
              </div>
              <form action={endSessionAction}>
                <input type="hidden" name="sessionId" value={s.id} />
                <Button type="submit" variant="ghost" size="sm" className="text-danger">Beenden</Button>
              </form>
            </div>
          ))}
          <FieldHint>Zwei-Faktor-Authentifizierung ist als nächste Ausbaustufe vorbereitet (siehe docs/security.md).</FieldHint>
        </CardContent>
      </Card>
    </div>
  );
}

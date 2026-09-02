import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Avatar, FieldHint } from "@steuerberaterflow/ui";
import { ProfileForm } from "@/app/(app)/settings/profile/profile-form";

export const metadata = { title: "Portal-Einstellungen" };

export default async function PortalSettingsPage() {
  const { user, client, organization } = await requireClientContext();

  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Einstellungen" description="Profil, Passwort und Sitzungen." />

      <Card>
        <CardHeader><CardTitle>Ihr Profil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="lg" />
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">{client.name}</p>
            <p className="text-xs text-muted">Kanzlei: {organization.name}</p>
          </div>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aktive Sitzungen ({sessions.length})</CardTitle></CardHeader>
        <CardContent>
          <FieldHint>
            Sie sind von {sessions.length} Gerät(en) aus angemeldet. Zum Abmelden einzelner Geräte
            nutzen Sie bitte die Kanzlei oder kontaktieren Sie den Support.
          </FieldHint>
        </CardContent>
      </Card>
    </div>
  );
}

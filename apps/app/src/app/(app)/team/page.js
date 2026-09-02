import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Avatar, Button } from "@steuerberaterflow/ui";
import { InviteMemberForm, RoleSelect } from "./team-client";
import { ROLE_LABELS, formatDateTime } from "@/lib/labels";

export const metadata = { title: "Mitarbeiter" };

export default async function TeamPage() {
  const { user, role, organization } = await requireFirmContext();

  if (!can(role, "team.manage")) {
    return (
      <div>
        <PageHeader title="Mitarbeiter" />
        <p className="text-sm text-muted">Nur Kanzleiinhaber können das Team verwalten.</p>
      </div>
    );
  }

  const [memberships, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF", "ACCOUNTANT"] } },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { organizationId: organization.id, role: { in: ["STAFF", "ACCOUNTANT"] }, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const limits = { SOLO: { users: 1 }, KANZLEI: { users: 10 }, PRO: { users: null } };
  const subscription = await prisma.subscription.findFirst({ where: { organizationId: organization.id } });
  const userLimit = limits[subscription?.plan || "SOLO"]?.users;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mitarbeiter"
        description={`${memberships.length}${userLimit ? `/${userLimit}` : ""} Kanzleibenutzer · Rollen und Zuständigkeiten`}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team ({memberships.length})</CardTitle>
            <CardDescription>Kanzleiinhaber, Mitarbeiter und externe Buchhalter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberships.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                <Avatar name={m.user.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{m.user.name}</p>
                  <p className="text-xs text-muted truncate">{m.user.email}</p>
                </div>
                <Badge tone={m.role === "OWNER" ? "green" : m.role === "ACCOUNTANT" ? "amber" : "blue"}>
                  {ROLE_LABELS[m.role]}
                </Badge>
                {m.role !== "OWNER" ? (
                  <RoleSelect membershipId={m.id} currentRole={m.role} />
                ) : (
                  <span className="text-xs text-muted w-24">–</span>
                )}
                <span className="text-[11px] text-muted">seit {formatDateTime(m.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Mitarbeiter einladen</CardTitle></CardHeader>
            <CardContent><InviteMemberForm /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Offene Einladungen ({invitations.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {invitations.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Keine offenen Einladungen.</p>
              ) : (
                invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{inv.name}</p>
                      <p className="text-xs text-muted truncate">{inv.email} · {ROLE_LABELS[inv.role]}</p>
                    </div>
                    <RevokeButton invitationId={inv.id} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { revokeInvitationAction } from "@/actions/settings";

function RevokeButton({ invitationId }) {
  return (
    <form action={revokeInvitationAction}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <Button type="submit" variant="ghost" size="sm" className="text-danger">Widerrufen</Button>
    </form>
  );
}

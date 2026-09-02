import { prisma } from "@/lib/db";
import { PageHeader, Card, CardContent, Badge, Avatar } from "@steuerberaterflow/ui";
import { ROLE_LABELS, formatDateTime } from "@/lib/labels";

export const metadata = { title: "Benutzer" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { memberships: { include: { organization: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Benutzer" description={`${users.length} Benutzerkonten plattformweit`} />
      <Card>
        <CardContent className="pt-4 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-muted truncate">{u.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {u.isPlatformAdmin ? <Badge tone="red">Plattform-Admin</Badge> : null}
                {!u.isActive ? <Badge tone="gray">Deaktiviert</Badge> : null}
                {u.memberships.map((m) => (
                  <Badge key={m.id} tone="gray">
                    {m.organization.name} · {ROLE_LABELS[m.role]}
                  </Badge>
                ))}
              </div>
              <span className="text-[11px] text-muted shrink-0">
                letzter Login: {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "nie"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

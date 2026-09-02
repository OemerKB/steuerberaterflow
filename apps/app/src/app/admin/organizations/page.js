import { prisma } from "@/lib/db";
import { PageHeader, Card, CardContent, Badge, Button } from "@steuerberaterflow/ui";
import { OrgSuspendForm } from "./org-forms";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Kanzleien" };

export default async function AdminOrganizationsPage() {
  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { clients: true, memberships: true, documents: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Kanzleien verwalten" description="Accounts sperren/aktivieren – jede Aktion wird protokolliert." />
      <Card>
        <CardContent className="pt-4 space-y-2">
          {orgs.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{o.name}</p>
                <p className="text-xs text-muted">
                  {o._count.clients} Mandanten · {o._count.memberships} Benutzer · {o._count.documents} Dokumente · erstellt {formatDateTime(o.createdAt)}
                </p>
              </div>
              <Badge tone={o.status === "ACTIVE" ? "green" : "red"}>{o.status === "ACTIVE" ? "Aktiv" : "Gesperrt"}</Badge>
              <OrgSuspendForm organizationId={o.id} suspended={o.status === "SUSPENDED"} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

import { prisma } from "@/lib/db";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { Users, Building2, HardDrive, FileText, Wrench, Flag } from "lucide-react";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Plattform-Übersicht" };

export default async function AdminPage() {
  const [orgs, users, docCount, audits, supportCases, flags] = await Promise.all([
    prisma.organization.findMany({ include: { _count: { select: { clients: true, memberships: true, documents: true } }, subscriptions: true } }),
    prisma.user.count(),
    prisma.document.count(),
    prisma.auditLog.findMany({ where: { organizationId: null }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.supportCase.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.featureFlag.findMany(),
  ]);

  const totalClients = orgs.reduce((acc, o) => acc + o._count.clients, 0);
  const totalDocuments = docCount;
  const storageBytes = await prisma.documentVersion.aggregate({ _sum: { sizeBytes: true } });

  return (
    <div className="space-y-6">
      <PageHeader title="Plattform-Übersicht" description="Globale Metriken · kein Zugriff auf Kanzleifremde Inhalte ohne protokollierte Aktion" />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Kanzleien" value={orgs.length} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Benutzer" value={users} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Mandanten" value={totalClients} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Dokumente" value={totalDocuments} icon={<FileText className="h-4 w-4" />} />
        <StatCard
          label="Speicherverbrauch"
          value={`${((storageBytes._sum.sizeBytes || 0) / (1024 * 1024)).toFixed(1)} MB`}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <StatCard label="Supportfälle" value={supportCases.length} icon={<Wrench className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Kanzleien</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {orgs.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.name}</p>
                  <p className="text-xs text-muted">{o._count.clients} Mandanten · {o._count.memberships} Benutzer · {o._count.documents} Dokumente</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge tone="gray">{o.subscriptions?.[0]?.plan || "SOLO"}</Badge>
                  <Badge tone={o.status === "ACTIVE" ? "green" : "red"}>{o.status === "ACTIVE" ? "Aktiv" : "Gesperrt"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Systemereignisse (plattformweit)</CardTitle></CardHeader>
            <CardContent>
              {audits.length === 0 ? (
                <p className="text-xs text-muted text-center py-3">Keine Ereignisse.</p>
              ) : (
                <ol className="space-y-2">
                  {audits.map((a) => (
                    <li key={a.id} className="text-sm">
                      <span className="font-medium">{a.actorName || "System"}</span> <span className="text-muted">{a.action}</span>
                      <span className="block text-[11px] text-muted">{formatDateTime(a.createdAt)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Feature Flags</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {flags.length === 0 ? (
                <p className="text-xs text-muted text-center py-3">Keine Flags definiert.</p>
              ) : (
                flags.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-mono">{f.key}</p>
                      <p className="text-[11px] text-muted">{f.description}</p>
                    </div>
                    <Badge tone={f.enabled ? "green" : "gray"}>{f.enabled ? "an" : "aus"}</Badge>
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

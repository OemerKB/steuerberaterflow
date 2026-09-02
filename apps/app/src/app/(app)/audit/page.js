import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Card, CardContent, EmptyState } from "@steuerberaterflow/ui";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Aktivitätsprotokoll" };

export default async function AuditPage({ searchParams }) {
  const { organization } = await requireFirmContext();
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page || 1));
  const pageSize = 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where: { organizationId: organization.id } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <PageHeader
        title="Aktivitätsprotokoll"
        description={`${total} protokollierte Ereignisse · revisionsnahe Änderungshistorie (GoBD-Vorbereitung)`}
      />
      <Card>
        <CardContent className="pt-4">
          {logs.length === 0 ? (
            <EmptyState title="Keine Einträge" />
          ) : (
            <ol className="space-y-0">
              {logs.map((l) => (
                <li key={l.id} className="flex gap-3 py-2 border-b border-border/60 last:border-0">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{l.actorName || "System"}</span>{" "}
                      <span className="text-muted">{l.action}</span>
                      {l.entityType ? <span className="text-muted"> · {l.entityType}</span> : null}
                    </p>
                    <p className="text-[11px] text-muted">{formatDateTime(l.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {totalPages > 1 ? (
            <div className="flex justify-between pt-3">
              {page > 1 ? <a href={`/audit?page=${page - 1}`} className="text-xs sf-link">Zurück</a> : <span />}
              {page < totalPages ? <a href={`/audit?page=${page + 1}`} className="text-xs sf-link">Weiter</a> : <span />}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

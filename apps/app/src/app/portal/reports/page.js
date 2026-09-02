import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { formatDateTime } from "@/lib/labels";
import Link from "next/link";

export const metadata = { title: "Auswertungen" };

export default async function PortalReportsPage() {
  const { client } = await requireClientContext();

  const reports = await prisma.report.findMany({
    where: { organizationId: client.organizationId, clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auswertungen &amp; Hinweise der Kanzlei</CardTitle>
        <p className="text-xs text-muted mt-1">Verständliche Aufbereitungen – keine automatisierten Steuerberechnungen.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {reports.length === 0 ? (
          <EmptyState title="Noch keine Auswertungen" description="Ihre Kanzlei veröffentlicht hier verständliche Auswertungen und Hinweise." />
        ) : (
          reports.map((r) => (
            <Link key={r.id} href={`/portal/reports/${r.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.isDemoData ? <Badge tone="amber">Beispiel</Badge> : null}
                </div>
                <p className="text-xs text-muted">{r.periodLabel || "ohne Zeitraum"} · {formatDateTime(r.createdAt)}</p>
              </div>
              <span className="text-xs sf-link shrink-0">Öffnen</span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

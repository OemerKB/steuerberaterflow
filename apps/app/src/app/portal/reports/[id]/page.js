import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@steuerberaterflow/ui";
import { MonthlyChart, CostBreakdownChart } from "@/components/report-charts";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Auswertung" };

export default async function PortalReportDetailPage({ params }) {
  const { id } = await params;
  const { client } = await requireClientContext();

  const report = await prisma.report.findFirst({
    where: { id, organizationId: client.organizationId, clientId: client.id },
  });
  if (!report) notFound();

  const data = typeof report.data === "object" ? report.data : {};
  const hasChartData = Array.isArray(data.monthly) && data.monthly.length > 0;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight">{report.title}</h1>
          {report.isDemoData ? <Badge tone="amber">Beispielauswertung – keine steuerliche Berechnung</Badge> : null}
        </div>
        <p className="text-sm text-muted mt-0.5">{report.periodLabel ? `${report.periodLabel} · ` : ""}{formatDateTime(report.createdAt)}</p>
      </div>

      {hasChartData ? (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Einnahmen &amp; Ausgaben</CardTitle>
              <CardDescription>Monatsvergleich (Beispiel)</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={data.monthly} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Größte Kostenkategorien</CardTitle>
              <CardDescription>Aufwandsverteilung (Beispiel)</CardDescription>
            </CardHeader>
            <CardContent>
              <CostBreakdownChart data={data.costs} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Hinweis der Kanzlei</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{report.content}</p>
        </CardContent>
      </Card>
    </div>
  );
}

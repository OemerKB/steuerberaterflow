import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@steuerberaterflow/ui";
import { MonthlyChart, CostBreakdownChart } from "@/components/report-charts";
import { formatDateTime, REPORT_KIND_LABELS } from "@/lib/labels";

export const metadata = { title: "Auswertung" };

export default async function ReportDetailPage({ params }) {
  const { id } = await params;
  const { organization } = await requireFirmContext();

  const report = await prisma.report.findFirst({
    where: { id, organizationId: organization.id },
    include: { client: { select: { id: true, name: true } } },
  });
  if (!report) notFound();

  const data = typeof report.data === "object" ? report.data : {};
  const hasChartData = Array.isArray(data.monthly) && data.monthly.length > 0;

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight">{report.title}</h1>
          {report.isDemoData ? <Badge tone="amber">Beispielauswertung – keine steuerliche Berechnung</Badge> : null}
        </div>
        <p className="text-sm text-muted mt-0.5">
          <Link href={`/clients/${report.client.id}`} className="sf-link">{report.client.name}</Link>
          {report.periodLabel ? ` · ${report.periodLabel}` : ""} · {formatDateTime(report.createdAt)} · {REPORT_KIND_LABELS[report.kind]}
        </p>
      </div>

      {hasChartData ? (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Einnahmen &amp; Ausgaben</CardTitle>
              <CardDescription>Monatsvergleich</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={data.monthly} />
              <p className="text-[10px] text-muted mt-2">Beispieldaten – keine steuerliche Berechnung.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Größte Kostenkategorien</CardTitle>
              <CardDescription>Aufwandsverteilung (Beispiel)</CardDescription>
            </CardHeader>
            <CardContent>
              <CostBreakdownChart data={data.costs} />
              <p className="text-[10px] text-muted mt-2">Beispieldaten – keine steuerliche Berechnung.</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Kanzlei-Hinweis</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{report.content}</p>
        </CardContent>
      </Card>
    </div>
  );
}

import { prisma } from "@/lib/db";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge } from "@steuerberaterflow/ui";
import { NewSupportCaseForm, FeatureFlagToggle } from "../organizations/org-forms";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "System & Support" };

export default async function AdminSystemPage() {
  const [organizations, supportCases, flags, audits] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.supportCase.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
    prisma.auditLog.findMany({ where: { action: { startsWith: "admin." } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="System & Support" description="Supportfälle, Feature Flags und protokollierte Admin-Aktionen" />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Supportfälle ({supportCases.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {supportCases.map((c) => (
              <div key={c.id} className="rounded-lg border border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{c.subject}</p>
                  <Badge tone={c.status === "OPEN" ? "amber" : "green"}>{c.status}</Badge>
                </div>
                {c.message ? <p className="text-xs text-muted mt-1">{c.message}</p> : null}
                <p className="text-[11px] text-muted mt-1">{formatDateTime(c.createdAt)}</p>
              </div>
            ))}
            {supportCases.length === 0 ? <p className="text-xs text-muted text-center py-3">Keine Fälle.</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Neuer Supportfall</CardTitle></CardHeader>
            <CardContent><NewSupportCaseForm organizations={organizations} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Feature Flags</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {flags.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-mono">{f.key}</p>
                    <p className="text-[11px] text-muted">{f.description}</p>
                  </div>
                  <Badge tone={f.enabled ? "green" : "gray"}>{f.enabled ? "an" : "aus"}</Badge>
                  <FeatureFlagToggle flag={f} />
                </div>
              ))}
              {flags.length === 0 ? <p className="text-xs text-muted text-center py-3">Keine Flags.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Protokollierte Admin-Aktionen</CardTitle></CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-xs text-muted text-center py-3">Keine Einträge.</p>
          ) : (
            <ol className="space-y-1.5">
              {audits.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="font-medium">{a.actorName}</span> <span className="text-muted">{a.action}</span>
                  <span className="block text-[11px] text-muted">{formatDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

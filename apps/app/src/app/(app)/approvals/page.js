import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Card, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { NewApprovalDialog } from "@/components/new-approval-dialog";
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES, APPROVAL_KIND_LABELS, formatDateTime } from "@/lib/labels";
import Link from "next/link";

export const metadata = { title: "Freigaben" };

export default async function ApprovalsPage({ searchParams }) {
  const { role, organization } = await requireFirmContext();
  const params = await searchParams;
  const status = params?.status || "PENDING";

  const approvals = await prisma.approvalRequest.findMany({
    where: { organizationId: organization.id, ...(status === "ALL" ? {} : { status }) },
    include: {
      client: { select: { id: true, name: true } },
      document: { select: { id: true, title: true } },
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const documents = await prisma.document.findMany({
    where: { organizationId: organization.id },
    select: { id: true, title: true, clientId: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Freigaben"
        description="Dokumente und Ergebnisse zur Kenntnis oder Freigabe an Mandanten senden. Einfache Bestätigung – keine qualifizierte elektronische Signatur."
        actions={can(role, "approvals.request") ? <NewApprovalDialog clients={clients} documents={documents} /> : null}
      />

      <div className="flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", "CHANGES", "ALL"].map((s) => (
          <a
            key={s}
            href={`/approvals?status=${s}`}
            className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${
              status === s ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:bg-accent/40"
            }`}
          >
            {s === "ALL" ? "Alle" : APPROVAL_STATUS_LABELS[s]}
          </a>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-2">
          {approvals.length === 0 ? (
            <EmptyState title="Keine Freigaben" description="In dieser Ansicht sind keine Anfragen vorhanden." />
          ) : (
            approvals.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted">
                    <Link href={`/clients/${a.client.id}`} className="hover:text-primary">{a.client.name}</Link>
                    {" · "}{APPROVAL_KIND_LABELS[a.kind]} · {formatDateTime(a.createdAt)}
                    {a.dueDate ? ` · fällig ${formatDateTime(a.dueDate)}` : ""}
                    {a.document ? <> · <Link href={`/documents/${a.document.id}`} className="sf-link">{a.document.title}</Link></> : null}
                  </p>
                </div>
                <Badge tone={APPROVAL_STATUS_TONES[a.status]}>{APPROVAL_STATUS_LABELS[a.status]}</Badge>
                {a.decisions[0] ? (
                  <span className="text-xs text-muted max-w-48 truncate">&bdquo;{a.decisions[0].comment || "ohne Kommentar"}&ldquo;</span>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

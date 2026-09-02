import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState, Button } from "@steuerberaterflow/ui";
import { NewApprovalDialog } from "@/components/new-approval-dialog";
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_TONES, APPROVAL_KIND_LABELS, formatDateTime } from "@/lib/labels";
import Link from "next/link";

export const metadata = { title: "Freigaben der Akte" };

export default async function ClientApprovalsPage({ params }) {
  const { clientId } = await params;
  const { role, organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const approvals = await prisma.approvalRequest.findMany({
    where: { organizationId: organization.id, clientId },
    include: { document: { select: { id: true, title: true } }, decisions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const documents = await prisma.document.findMany({
    where: { organizationId: organization.id, clientId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <div>
          <CardTitle>Freigaben ({approvals.length})</CardTitle>
          <p className="text-xs text-muted mt-1">Einfache Bestätigung – keine qualifizierte elektronische Signatur.</p>
        </div>
        {can(role, "approvals.request") ? (
          <NewApprovalDialog clients={[{ id: client.id, name: client.name }]} documents={documents} defaultClientId={client.id} />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {approvals.length === 0 ? (
          <EmptyState title="Keine Freigaben" description="Fordern Sie eine Prüfung oder Bestätigung durch den Mandanten an." />
        ) : (
          approvals.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted">
                  {APPROVAL_KIND_LABELS[a.kind]} · {formatDateTime(a.createdAt)}
                  {a.document ? <> · <Link href={`/documents/${a.document.id}`} className="sf-link">{a.document.title}</Link></> : null}
                </p>
              </div>
              <Badge tone={APPROVAL_STATUS_TONES[a.status]}>{APPROVAL_STATUS_LABELS[a.status]}</Badge>
              {a.decisions[0]?.comment ? <span className="text-xs text-muted">&bdquo;{a.decisions[0].comment}&ldquo;</span> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

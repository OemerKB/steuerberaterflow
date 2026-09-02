import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState, FieldHint } from "@steuerberaterflow/ui";
import { ApprovalDecisionForm } from "./approval-form";
import { APPROVAL_KIND_LABELS, formatDateTime } from "@/lib/labels";
import Link from "next/link";

export const metadata = { title: "Freigaben" };

export default async function PortalApprovalsPage() {
  const { client } = await requireClientContext();

  const approvals = await prisma.approvalRequest.findMany({
    where: { organizationId: client.organizationId, clientId: client.id },
    include: { document: { select: { id: true, title: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Freigaben ({approvals.filter((a) => a.status === "PENDING").length} offen)</CardTitle>
          <p className="text-xs text-muted mt-1">
            Ihre Bestätigung dokumentiert die Kenntnisnahme. Es handelt sich um keine qualifizierte elektronische Signatur.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvals.length === 0 ? (
            <EmptyState title="Keine Freigaben" description="Die Kanzlei hat keine Prüfungen angefordert." />
          ) : (
            approvals.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted">
                      {APPROVAL_KIND_LABELS[a.kind]} · {formatDateTime(a.createdAt)}
                      {a.dueDate ? ` · bitte bis ${formatDateTime(a.dueDate)}` : ""}
                    </p>
                  </div>
                  <Badge tone={a.status === "PENDING" ? "amber" : a.status === "APPROVED" ? "green" : a.status === "REJECTED" ? "red" : "blue"}>
                    {a.status === "PENDING" ? "Ihre Entscheidung" : a.status === "APPROVED" ? "Freigegeben" : a.status === "REJECTED" ? "Abgelehnt" : "Änderung erbeten"}
                  </Badge>
                </div>
                {a.message ? <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">{a.message}</p> : null}
                {a.document ? (
                  <p className="text-xs mt-2">
                    Dokument:{" "}
                    <a href={`/api/documents/${a.document.id}/file`} target="_blank" rel="noreferrer" className="sf-link">
                      {a.document.title} ansehen
                    </a>
                  </p>
                ) : null}
                {a.status === "PENDING" ? (
                  <ApprovalDecisionForm requestId={a.id} />
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

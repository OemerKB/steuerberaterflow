import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Badge, Button } from "@steuerberaterflow/ui";
import { Archive, ArchiveRestore } from "lucide-react";
import { archiveClientAction } from "@/actions/clients";
import { ClientTabs } from "@/components/client-tabs";
import { CLIENT_PROCESS_STATUS, CLIENT_TYPE_LABELS } from "@/lib/labels";
import { clientProcessStatus } from "@/lib/workflow";

export default async function ClientLayout({ children, params }) {
  const { clientId } = await params;
  const { user, role, organization } = await requireFirmContext();

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organization.id },
    include: {
      responsible: { select: { name: true } },
      tasks: { where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] } }, select: { status: true, dueDate: true } },
      documentRequests: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, include: { items: { where: { status: "MISSING" } } } },
      approvals: { where: { status: "PENDING" }, select: { id: true } },
      conversations: {
        where: { type: "CLIENT", archivedAt: null },
        include: { messages: { where: { senderId: null }, orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!client) notFound();

  const missing = client.documentRequests.reduce((acc, r) => acc + r.items.length, 0);
  const processStatus = clientProcessStatus({
    missingItems: missing,
    openQuestions: client.conversations.filter((c) => c.messages.length > 0).length,
    pendingApprovals: client.approvals.length,
    openTasks: client.tasks.length,
    inProgress: client.tasks.filter((t) => t.status === "IN_PROGRESS").length,
  });
  const statusInfo = CLIENT_PROCESS_STATUS[processStatus];

  return (
    <div>
      {/* Kopf */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
            <Badge tone={client.status === "ARCHIVED" ? "gray" : statusInfo.tone}>
              {client.status === "ARCHIVED" ? "Archiviert" : statusInfo.label}
            </Badge>
            <Badge tone="gray">{CLIENT_TYPE_LABELS[client.type]}</Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">
            {client.responsible?.name ? `Zuständig: ${client.responsible.name}` : "Kein Mitarbeiter zugewiesen"}
            {client.company ? ` · ${client.company}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {role === "OWNER" ? (
            <form action={archiveClientAction}>
              <input type="hidden" name="clientId" value={client.id} />
              <Button variant="secondary" size="sm" type="submit">
                {client.status === "ARCHIVED" ? <><ArchiveRestore className="h-3.5 w-3.5" /> Reaktivieren</> : <><Archive className="h-3.5 w-3.5" /> Archivieren</>}
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {/* Tab-Navigation */}
      <ClientTabs clientId={client.id} />

      {children}
    </div>
  );
}

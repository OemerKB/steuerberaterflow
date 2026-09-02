import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Badge, Button } from "@steuerberaterflow/ui";
import { ClientsTable } from "./clients-table";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { CLIENT_TYPE_LABELS, formatDateTime } from "@/lib/labels";
import { isTaskOverdue, clientProcessStatus } from "@/lib/workflow";

export const metadata = { title: "Mandanten" };

export default async function ClientsPage({ searchParams }) {
  const { user, role, organization } = await requireFirmContext();
  const params = await searchParams;
  const filterStatus = params?.status || "ACTIVE";
  const filterResponsible = params?.responsible || "";

  const where = {
    organizationId: organization.id,
    ...(filterStatus === "ALL" ? {} : { status: filterStatus }),
    ...(filterResponsible ? { responsibleUserId: filterResponsible } : {}),
    // Externe Buchhalter sehen nur zugewiesene Mandanten
    ...(role === "ACCOUNTANT" ? { assignments: { some: { userId: user.id } } } : {}),
  };

  const include = {
    responsible: { select: { name: true } },
    tasks: { where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] } }, select: { status: true, dueDate: true } },
    documentRequests: {
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: { items: { where: { status: "MISSING" }, select: { id: true } } },
    },
    deadlines: {
      where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
      orderBy: { dueDate: "asc" },
      take: 1,
      select: { dueDate: true },
    },
    approvals: { where: { status: "PENDING" }, select: { id: true } },
    conversations: {
      where: { type: "CLIENT", archivedAt: null },
      include: { messages: { where: { senderId: null }, orderBy: { createdAt: "desc" }, take: 1 } },
    },
  };

  const clients = await prisma.client.findMany({ where, include, orderBy: { name: "asc" } });

  // Letzte Aktivität pro Mandant (aus dem Audit-Log)
  const clientIds = clients.map((c) => c.id);
  const recentLogs = clientIds.length
    ? await prisma.auditLog.findMany({
        where: { organizationId: organization.id, entityId: { in: clientIds } },
        orderBy: { createdAt: "desc" },
        take: 500,
        select: { entityId: true, createdAt: true },
      })
    : [];
  const lastActivityByClient = {};
  for (const log of recentLogs) {
    if (!lastActivityByClient[log.entityId]) lastActivityByClient[log.entityId] = log.createdAt;
  }

  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  const rows = clients.map((c) => {
    const openTasks = c.tasks.filter((t) => !isTaskOverdue(t)).length;
    const overdueTasks = c.tasks.filter((t) => isTaskOverdue(t)).length;
    const missing = c.documentRequests.reduce((acc, r) => acc + r.items.length, 0);
    const processStatus = clientProcessStatus({
      missingItems: missing,
      openQuestions: c.conversations.filter((conv) => conv.messages.length > 0).length,
      pendingApprovals: c.approvals.length,
      openTasks,
      inProgress: c.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    });
    return {
      id: c.id,
      name: c.name,
      company: c.company || c.name,
      type: CLIENT_TYPE_LABELS[c.type] || c.type,
      responsible: c.responsible?.name || "–",
      status: c.status,
      openTasks,
      overdueTasks,
      missing,
      processStatus,
      nextDeadline: c.deadlines[0]?.dueDate || null,
      lastActivity: lastActivityByClient[c.id] || c.updatedAt,
      archived: c.status === "ARCHIVED",
    };
  });

  return (
    <div>
      <PageHeader
        title="Mandanten"
        description={`${rows.filter((r) => !r.archived).length} aktive Mandanten · digitale Mandantenakte mit vollständigem Überblick`}
        actions={
          <div className="flex gap-2">
            <NewRequestDialog clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
            {can(role, "clients.create") ? (
              <Link
                href="/clients/new"
                className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover"
              >
                + Neuer Mandant
              </Link>
            ) : null}
          </div>
        }
      />
      <ClientsTable
        rows={rows}
        staff={staff.map((s) => ({ id: s.userId, name: s.user.name }))}
        currentFilter={{ status: filterStatus, responsible: filterResponsible }}
        canArchive={can(role, "clients.archive")}
      />
    </div>
  );
}

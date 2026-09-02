import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { AppShell } from "@/components/app-shell";

export default async function PortalLayout({ children }) {
  const { user, client, organization } = await requireClientContext();

  const [openTasks, missingItems, unreadMessages, pendingApprovals, unreadNotifications, nextAppointment] =
    await Promise.all([
      prisma.task.count({ where: { organizationId: client.organizationId, clientId: client.id, status: "WAITING_CLIENT" } }),
      prisma.requestItem.count({ where: { status: "MISSING", request: { organizationId: client.organizationId, clientId: client.id, status: { in: ["OPEN", "IN_PROGRESS"] } } } }),
      prisma.conversation.count({
        where: { organizationId: client.organizationId, clientId: client.id, type: "CLIENT", archivedAt: null,
          messages: { some: { senderId: { not: null } } },
          reads: { none: { userId: user.id } } },
      }),
      prisma.approvalRequest.count({ where: { organizationId: client.organizationId, clientId: client.id, status: "PENDING" } }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      prisma.appointment.findFirst({
        where: { organizationId: client.organizationId, clientId: client.id, startsAt: { gte: new Date() }, status: { in: ["REQUESTED", "CONFIRMED"] } },
      }),
    ]);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const navItems = [
    { href: "/portal", label: "Start", icon: "dashboard" },
    { href: "/portal/tasks", label: "Meine Aufgaben", icon: "tasks", count: openTasks },
    { href: "/portal/requests", label: "Unterlagen", icon: "requests", count: missingItems },
    { href: "/portal/documents", label: "Dokumente", icon: "documents" },
    { href: "/portal/messages", label: "Nachrichten", icon: "messages", count: unreadMessages },
    { href: "/portal/appointments", label: "Termine", icon: "appointments" },
    { href: "/portal/approvals", label: "Freigaben", icon: "approvals", count: pendingApprovals },
    { href: "/portal/reports", label: "Auswertungen", icon: "reports" },
    { href: "/portal/settings", label: "Einstellungen", icon: "settings" },
  ];

  return (
    <AppShell user={{ name: user.name, role: "CLIENT" }} orgName={organization.name} navItems={navItems} notifications={notifications}>
      {children}
    </AppShell>
  );
}

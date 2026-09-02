import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { AppShell } from "@/components/app-shell";

export default async function FirmLayout({ children }) {
  const { user, role, organization } = await requireFirmContext();

  const [
    openTasks,
    missingItems,
    unreadMessages,
    unreadNotifications,
    pendingApprovals,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.task.count({ where: { organizationId: organization.id, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM"] } } }),
    prisma.requestItem.count({ where: { status: "MISSING", request: { organizationId: organization.id, status: { in: ["OPEN", "IN_PROGRESS"] } } } }),
    // Ungelesene Mandantennachrichten: letzte Nachricht einer Client-Konversation vom Mandanten, nach letzter Lesezeit
    prisma.conversation.count({
      where: {
        organizationId: organization.id,
        type: "CLIENT",
        archivedAt: null,
        messages: { some: { senderId: null } },
        reads: { none: { userId: user.id, lastReadAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) } } },
      },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.approvalRequest.count({ where: { organizationId: organization.id, status: "PENDING" } }),
    prisma.deadline.count({
      where: {
        organizationId: organization.id,
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        dueDate: { lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const navItems = [
    { href: "/dashboard", label: "Übersicht", icon: "dashboard" },
    { href: "/clients", label: "Mandanten", icon: "clients" },
    { href: "/documents", label: "Dokumente", icon: "documents" },
    { href: "/receipts", label: "Belege", icon: "receipts" },
    { href: "/tasks", label: "Aufgaben", icon: "tasks", count: openTasks },
    { href: "/deadlines", label: "Fristen", icon: "deadlines", count: upcomingDeadlines },
    { href: "/messages", label: "Nachrichten", icon: "messages", count: unreadMessages },
    { href: "/appointments", label: "Termine", icon: "appointments" },
    { href: "/approvals", label: "Freigaben", icon: "approvals", count: pendingApprovals },
    { href: "/requests", label: "Fehlende Unterlagen", icon: "requests", count: missingItems },
    { href: "/reports", label: "Auswertungen", icon: "reports" },
    ...(role === "OWNER" ? [{ href: "/team", label: "Mitarbeiter", icon: "team" }] : []),
    ...(role !== "ACCOUNTANT" ? [{ href: "/audit", label: "Aktivitätsprotokoll", icon: "audit" }] : []),
    ...(role === "OWNER" ? [{ href: "/settings", label: "Einstellungen", icon: "settings" }] : []),
  ];

  return (
    <AppShell
      user={{ name: user.name, role }}
      orgName={organization.name}
      navItems={navItems}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}

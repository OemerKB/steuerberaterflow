import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/context";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }) {
  const session = await requirePlatformAdmin();

  const [orgCount, userCount] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
  ]);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <AppShell
      user={{ name: `${session.user.name} (Plattform-Admin)`, role: "OWNER" }}
      orgName="Plattform-Administration"
      navItems={[
        { href: "/admin", label: "Übersicht", icon: "dashboard" },
        { href: "/admin/organizations", label: "Kanzleien", icon: "clients", count: orgCount },
        { href: "/admin/users", label: "Benutzer", icon: "team", count: userCount },
        { href: "/admin/system", label: "System & Support", icon: "audit" },
      ]}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}

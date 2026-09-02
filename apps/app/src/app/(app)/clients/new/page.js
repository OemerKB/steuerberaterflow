import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader } from "@steuerberaterflow/ui";
import { OnboardingWizard } from "./wizard";

export const metadata = { title: "Mandant onboarding" };

export default async function NewClientPage() {
  const { role, organization } = await requireFirmContext();
  if (!can(role, "clients.create")) {
    return (
      <div>
        <PageHeader title="Neuer Mandant" />
        <p className="text-sm text-muted">Sie haben keine Berechtigung, Mandanten anzulegen.</p>
      </div>
    );
  }

  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Mandant onboarding"
        description="Geführter Prozess: Stammdaten, Rechtsform, Ansprechpartner, Steuerarten, Unterlagen und Einladung."
      />
      <OnboardingWizard
        staff={staff.map((s) => ({ id: s.userId, name: s.user.name }))}
        backHref="/clients"
      />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@steuerberaterflow/ui";
import { OrgSettingsForm } from "./org-settings-form";
import { emailConfigured } from "@/lib/adapters/email";
import { aiMode } from "@/lib/adapters/ai";

export const metadata = { title: "Kanzlei-Einstellungen" };

export default async function SettingsPage() {
  const { role, organization } = await requireFirmContext();

  if (!can(role, "settings.manage")) {
    return (
      <div>
        <PageHeader title="Einstellungen" />
        <p className="text-sm text-muted">Nur Kanzleiinhaber können die Kanzleieinstellungen verwalten.</p>
      </div>
    );
  }

  const settings = await prisma.organizationSettings.upsert({
    where: { organizationId: organization.id },
    create: { organizationId: organization.id },
    update: {},
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Einstellungen" description="Kanzleikonfiguration, Branding, Sprache und KI-Optionen." />
      <OrgSettingsForm organization={organization} settings={settings} emailConfigured={emailConfigured} aiMode={aiMode} />
    </div>
  );
}

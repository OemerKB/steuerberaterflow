"use server";

import { revalidatePath } from "next/cache";
import { adminOrgActionSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/context";
import { logAudit } from "@/lib/audit";

/**
 * Plattform-Administration.
 * Supportzugriff auf Kanzleidaten ist nur über protokollierte Aktionen möglich;
 * Kanzleifremde Daten werden niemals ohne Grund angezeigt.
 */

export async function adminToggleOrgStatusAction(prevState, formData) {
  const session = await requirePlatformAdmin();
  const parsed = adminOrgActionSchema.safeParse({
    organizationId: formData.get("organizationId") || "",
    action: formData.get("action") || "",
    reason: formData.get("reason") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const org = await prisma.organization.findUnique({ where: { id: parsed.data.organizationId } });
  if (!org) return { error: "Kanzlei nicht gefunden." };

  const status = parsed.data.action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";
  await prisma.organization.update({ where: { id: org.id }, data: { status } });
  await logAudit({
    organizationId: org.id,
    actorId: session.user.id,
    actorName: `${session.user.name} (Plattform-Admin)`,
    action: status === "SUSPENDED" ? "admin.org_suspended" : "admin.org_activated",
    entityType: "Organization",
    entityId: org.id,
    metadata: { reason: parsed.data.reason },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  return { success: status === "SUSPENDED" ? "Kanzlei gesperrt." : "Kanzlei aktiviert." };
}

export async function adminCreateSupportCaseAction(prevState, formData) {
  const session = await requirePlatformAdmin();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const organizationId = String(formData.get("organizationId") || "") || null;
  if (subject.length < 3) return { error: "Bitte Betreff angeben." };
  await prisma.supportCase.create({
    data: { subject, message, organizationId, handledBy: session.user.id },
  });
  await logAudit({
    organizationId,
    actorId: session.user.id,
    actorName: `${session.user.name} (Plattform-Admin)`,
    action: "admin.support_case_created",
    entityType: "SupportCase",
    metadata: { subject },
  });
  revalidatePath("/admin");
  return { success: "Supportfall erstellt." };
}

export async function adminToggleFeatureFlagAction(formData) {
  const session = await requirePlatformAdmin();
  const flagId = String(formData.get("flagId") || "");
  const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
  if (!flag) return { error: "Feature-Flag nicht gefunden." };
  await prisma.featureFlag.update({ where: { id: flagId }, data: { enabled: !flag.enabled } });
  await logAudit({
    actorId: session.user.id,
    actorName: `${session.user.name} (Plattform-Admin)`,
    action: "admin.feature_flag_toggled",
    entityType: "FeatureFlag",
    entityId: flagId,
    metadata: { enabled: !flag.enabled },
  });
  revalidatePath("/admin");
  return { success: `Feature-Flag „${flag.key}" aktualisiert.` };
}

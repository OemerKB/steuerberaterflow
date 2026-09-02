"use server";

import { revalidatePath } from "next/cache";
import { documentMetadataSchema, documentUpdateSchema, documentCommentSchema } from "@steuerberaterflow/validation";
import { FILE_UPLOAD } from "@steuerberaterflow/config";
import { prisma } from "@/lib/db";
import { guard, guardPortal } from "@/lib/context";
import { logAudit, notifyOrgMembers } from "@/lib/audit";
import { sha256Hex } from "@/lib/crypto";
import { validateUpload, isTaskOverdue } from "@/lib/workflow";
import { rateLimit } from "@/lib/ratelimit";
import { analyzeDocument, findDuplicateHints } from "@/lib/adapters/ai";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/labels";

/** Upload durch Kanzlei (auch im Namen von Mandanten via Beleg-Upload). */
export async function uploadDocumentsAction(prevState, formData) {
  const { user, organization } = await guard("documents.create");

  const limit = rateLimit({ key: `upload:${user.id}`, limit: 30, windowMs: 60 * 1000 });
  if (!limit.allowed) return { error: "Zu viele Uploads in kurzer Zeit. Bitte kurz warten." };

  const clientId = String(formData.get("clientId") || "") || null;
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
    if (!client) return { error: "Mandant nicht gefunden." };
  }

  const files = formData.getAll("files").filter((f) => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Bitte mindestens eine Datei auswählen." };

  const category = String(formData.get("category") || "OTHER");
  const taxYear = formData.get("taxYear") ? Number(formData.get("taxYear")) : null;
  const month = formData.get("month") ? Number(formData.get("month")) : null;
  const description = String(formData.get("description") || "");

  const created = [];
  const errors = [];
  const duplicateHints = [];

  for (const file of files) {
    const validation = validateUpload({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      maxBytes: FILE_UPLOAD.maxBytes,
      allowedMimeTypes: FILE_UPLOAD.allowedMimeTypes,
      allowedExtensions: FILE_UPLOAD.allowedExtensions,
    });
    if (!validation.ok) {
      errors.push(`${file.name}: ${validation.errors.join(" ")}`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = sha256Hex(buffer);

    // KI-Vorschlag (Mock oder Provider) – immer nur Entwurf
    const suggestion = await analyzeDocument({ fileName: file.name });
    const dupes = await findDuplicateHints({ checksum, organizationId: organization.id });

    const doc = await prisma.document.create({
      data: {
        organizationId: organization.id,
        clientId,
        category: category in DOCUMENT_CATEGORY_LABELS ? category : suggestion.category === "OTHER" ? "OTHER" : category,
        title: file.name.replace(/\.[a-z0-9]{2,5}$/i, "") || "Dokument",
        description,
        status: "NEW",
        taxYear,
        month,
        uploadedById: user.id,
        isAiAnalyzed: true,
        versions: {
          create: {
            version: 1,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            checksum,
            data: buffer,
            uploadedById: user.id,
          },
        },
      },
    });
    if (dupes.length > 0) duplicateHints.push({ fileName: file.name, duplicates: dupes });
    created.push(doc);
    await logAudit({
      organizationId: organization.id,
      actorId: user.id,
      actorName: user.name,
      action: "document.uploaded",
      entityType: "Document",
      entityId: doc.id,
      metadata: { fileName: file.name, sizeBytes: file.size },
    });
  }

  if (clientId) {
    await notifyOrgMembers({
      organizationId: organization.id,
      roles: ["OWNER", "STAFF"],
      exceptUserId: user.id,
      type: "document",
      title: "Neues Dokument",
      body: `${created.length} Dokument(e) hochgeladen.`,
      link: clientId ? `/clients/${clientId}/dokumente` : "/documents",
    });
  }

  revalidatePath("/documents");
  revalidatePath("/receipts");
  if (clientId) revalidatePath(`/clients/${clientId}/dokumente`);
  revalidatePath("/dashboard");

  if (created.length === 0) return { error: errors.join(" ") || "Upload fehlgeschlagen." };
  return {
    success: `${created.length} Dokument(e) hochgeladen.`,
    errors: errors.length ? errors : undefined,
    duplicateHints,
  };
}

export async function updateDocumentAction(prevState, formData) {
  const { user, organization } = await guard("documents.update");
  const documentId = String(formData.get("documentId") || "");
  const doc = await prisma.document.findFirst({ where: { id: documentId, organizationId: organization.id } });
  if (!doc) return { error: "Dokument nicht gefunden." };

  const parsed = documentUpdateSchema.safeParse({
    title: formData.get("title") || doc.title,
    category: formData.get("category") || doc.category,
    description: formData.get("description") ?? doc.description,
    taxYear: formData.get("taxYear") ? Number(formData.get("taxYear")) : null,
    month: formData.get("month") ? Number(formData.get("month")) : null,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);

  await prisma.document.update({
    where: { id: documentId },
    data: { ...parsed.data, tags },
  });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "document.updated",
    entityType: "Document",
    entityId: documentId,
  });
  revalidatePath("/documents");
  if (doc.clientId) revalidatePath(`/clients/${doc.clientId}/dokumente`);
  revalidatePath(`/documents/${documentId}`);
  return { success: "Dokument gespeichert." };
}

export async function setDocumentStatusAction(formData) {
  const { user, organization } = await guard("documents.status");
  const documentId = String(formData.get("documentId") || "");
  const status = String(formData.get("status") || "");
  if (!(status in DOCUMENT_STATUS_LABELS)) return { error: "Ungültiger Status." };
  const doc = await prisma.document.findFirst({ where: { id: documentId, organizationId: organization.id } });
  if (!doc) return { error: "Dokument nicht gefunden." };
  await prisma.document.update({ where: { id: documentId }, data: { status } });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "document.status_changed",
    entityType: "Document",
    entityId: documentId,
    metadata: { from: doc.status, to: status },
  });
  revalidatePath("/documents");
  revalidatePath("/receipts");
  if (doc.clientId) revalidatePath(`/clients/${doc.clientId}/dokumente`);
  return { success: `Status geändert: ${DOCUMENT_STATUS_LABELS[status]}` };
}

export async function addDocumentCommentAction(prevState, formData) {
  const { user, organization } = await guard("documents.update");
  const documentId = String(formData.get("documentId") || "");
  const doc = await prisma.document.findFirst({ where: { id: documentId, organizationId: organization.id } });
  if (!doc) return { error: "Dokument nicht gefunden." };
  const parsed = documentCommentSchema.safeParse({
    content: formData.get("content") || "",
    isInternal: formData.get("isInternal") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  await prisma.documentComment.create({
    data: { documentId, authorId: user.id, content: parsed.data.content, isInternal: parsed.data.isInternal },
  });
  revalidatePath(`/documents/${documentId}`);
  return { success: "Kommentar gespeichert." };
}

/** Neue Version hochladen (Versionierung). */
export async function uploadDocumentVersionAction(prevState, formData) {
  const { user, organization } = await guard("documents.update");
  const documentId = String(formData.get("documentId") || "");
  const doc = await prisma.document.findFirst({
    where: { id: documentId, organizationId: organization.id },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!doc) return { error: "Dokument nicht gefunden." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Bitte Datei auswählen." };
  const validation = validateUpload({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    maxBytes: FILE_UPLOAD.maxBytes,
    allowedMimeTypes: FILE_UPLOAD.allowedMimeTypes,
    allowedExtensions: FILE_UPLOAD.allowedExtensions,
  });
  if (!validation.ok) return { error: validation.errors.join(" ") };

  const buffer = Buffer.from(await file.arrayBuffer());
  const nextVersion = (doc.versions[0]?.version || 0) + 1;
  await prisma.documentVersion.create({
    data: {
      documentId,
      version: nextVersion,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      checksum: sha256Hex(buffer),
      data: buffer,
      uploadedById: user.id,
    },
  });
  await prisma.document.update({
    where: { id: documentId },
    data: { currentVersion: nextVersion, updatedAt: new Date() },
  });
  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: "document.version_uploaded",
    entityType: "Document",
    entityId: documentId,
    metadata: { version: nextVersion, fileName: file.name },
  });
  revalidatePath(`/documents/${documentId}`);
  return { success: `Version ${nextVersion} hochgeladen.` };
}

/* ------------------------- Mandantenportal-Upload -------------------------- */

export async function portalUploadDocumentsAction(prevState, formData) {
  const { user, client } = await guardPortal("portal.documents.upload");
  const files = formData.getAll("files").filter((f) => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Bitte mindestens eine Datei auswählen." };

  const requestItemId = String(formData.get("requestItemId") || "") || null;
  const category = String(formData.get("category") || "OTHER");
  const description = String(formData.get("description") || "");

  if (requestItemId) {
    const item = await prisma.requestItem.findUnique({
      where: { id: requestItemId },
      include: { request: true },
    });
    if (!item || item.request.clientId !== client.id) {
      return { error: "Unterlagenanforderung nicht gefunden." };
    }
  }

  const created = [];
  const errors = [];
  for (const file of files) {
    const validation = validateUpload({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      maxBytes: FILE_UPLOAD.maxBytes,
      allowedMimeTypes: FILE_UPLOAD.allowedMimeTypes,
      allowedExtensions: FILE_UPLOAD.allowedExtensions,
    });
    if (!validation.ok) {
      errors.push(`${file.name}: ${validation.errors.join(" ")}`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const suggestion = await analyzeDocument({ fileName: file.name });
    const doc = await prisma.document.create({
      data: {
        organizationId: client.organizationId,
        clientId: client.id,
        category: category in DOCUMENT_CATEGORY_LABELS ? category : suggestion.category,
        title: file.name.replace(/\.[a-z0-9]{2,5}$/i, "") || "Dokument",
        description,
        status: "NEW",
        uploadedById: null,
        versions: {
          create: {
            version: 1,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            checksum: sha256Hex(buffer),
            data: buffer,
          },
        },
      },
    });
    if (requestItemId) {
      await prisma.requestItem.update({
        where: { id: requestItemId },
        data: { status: "UPLOADED", documentId: doc.id },
      });
    }
    created.push(doc);
    await logAudit({
      organizationId: client.organizationId,
      actorId: user.id,
      actorName: client.name,
      action: "document.uploaded_by_client",
      entityType: "Document",
      entityId: doc.id,
      metadata: { fileName: file.name, clientName: client.name },
    });
  }

  await notifyOrgMembers({
    organizationId: client.organizationId,
    roles: ["OWNER", "STAFF"],
    type: "document",
    title: "Mandant hat Dokumente hochgeladen",
    body: `${client.name}: ${created.length} Datei(en).`,
    link: `/clients/${client.id}/dokumente`,
  });

  revalidatePath("/portal/documents");
  revalidatePath("/portal/requests");
  revalidatePath("/portal");
  revalidatePath("/documents");

  if (created.length === 0) return { error: errors.join(" ") };
  return { success: `${created.length} Datei(en) übermittelt.`, errors: errors.length ? errors : undefined };
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentsTable } from "@/components/documents-table";
import { mapDocumentRow } from "@/lib/document-row";

export const metadata = { title: "Dokumente der Akte" };

export default async function ClientDocumentsPage({ params }) {
  const { clientId } = await params;
  const { role, organization } = await requireFirmContext();

  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const documents = await prisma.document.findMany({
    where: { organizationId: organization.id, clientId },
    include: { client: { select: { name: true } }, uploadedBy: { select: { name: true } }, versions: { orderBy: { version: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      {can(role, "documents.create") ? <UploadDropzone clientId={client.id} compact /> : null}
      <DocumentsTable documents={documents.map(mapDocumentRow)} emptyTitle="Keine Dokumente in dieser Akte" />
    </div>
  );
}

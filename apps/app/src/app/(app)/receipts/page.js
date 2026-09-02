import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { PageHeader } from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentsTable } from "@/components/documents-table";
import { mapDocumentRow } from "@/lib/document-row";
import { RECEIPT_CATEGORIES } from "@/lib/labels";

export const metadata = { title: "Belege" };

/** Belege = buchungsrelevante Dokumentkategorien (Eingang/Ausgang, Bank, Kasse). */
export default async function ReceiptsPage() {
  const { organization } = await requireFirmContext();

  const documents = await prisma.document.findMany({
    where: { organizationId: organization.id, category: { in: RECEIPT_CATEGORIES } },
    include: { client: { select: { name: true } }, uploadedBy: { select: { name: true } }, versions: { orderBy: { version: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Belege"
        description="Buchungsrelevante Belege: Eingangs- und Ausgangsrechnungen, Bank, Kasse – bereit für den DATEV-Export (Vorbereitung)."
      />
      <UploadDropzone compact />
      <DocumentsTable documents={documents.map(mapDocumentRow)} showClient emptyTitle="Keine Belege" />
    </div>
  );
}

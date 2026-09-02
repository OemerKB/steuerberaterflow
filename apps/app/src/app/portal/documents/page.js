import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent } from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentsTable } from "@/components/documents-table";
import { mapDocumentRow } from "@/lib/document-row";

export const metadata = { title: "Meine Dokumente" };

export default async function PortalDocumentsPage() {
  const { client } = await requireClientContext();

  const documents = await prisma.document.findMany({
    where: { organizationId: client.organizationId, clientId: client.id },
    include: { client: { select: { name: true } }, uploadedBy: { select: { name: true } }, versions: { orderBy: { version: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  // Mandanten sehen keine internen Kommentare – Dokumentdetail nur über geschützte API/Preview.
  return (
    <div className="space-y-5">
      <UploadDropzone clientId={client.id} compact />
      <Card>
        <CardHeader><CardTitle>Meine Dokumente ({documents.length})</CardTitle></CardHeader>
        <CardContent>
          <DocumentsTable documents={documents.map(mapDocumentRow)} emptyTitle="Noch keine Dokumente" />
        </CardContent>
      </Card>
    </div>
  );
}

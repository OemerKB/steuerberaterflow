import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { DocumentsTable } from "@/components/documents-table";
import { mapDocumentRow } from "@/lib/document-row";
import { RECEIPT_CATEGORIES } from "@/lib/labels";

export const metadata = { title: "Belege der Akte" };

export default async function ClientReceiptsPage({ params }) {
  const { clientId } = await params;
  const { organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const documents = await prisma.document.findMany({
    where: { organizationId: organization.id, clientId, category: { in: RECEIPT_CATEGORIES } },
    include: { client: { select: { name: true } }, uploadedBy: { select: { name: true } }, versions: { orderBy: { version: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DocumentsTable documents={documents.map(mapDocumentRow)} emptyTitle="Keine Belege in dieser Akte" />
  );
}

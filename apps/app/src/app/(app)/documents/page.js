import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Badge, Card, CardContent } from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentsTable } from "@/components/documents-table";
import { mapDocumentRow } from "@/lib/document-row";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_CATEGORY_LABELS, RECEIPT_CATEGORIES } from "@/lib/labels";

export const metadata = { title: "Dokumente" };

export default async function DocumentsPage({ searchParams }) {
  const { role, organization } = await requireFirmContext();
  const params = await searchParams;
  const status = params?.status || "";
  const category = params?.category || "";
  const clientId = params?.client || "";

  const documents = await prisma.document.findMany({
    where: {
      organizationId: organization.id,
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(clientId ? { clientId } : {}),
    },
    include: { client: { select: { name: true } }, uploadedBy: { select: { name: true } }, versions: { orderBy: { version: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const rows = documents.map(mapDocumentRow);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dokumente"
        description={`${documents.length} Dokumente · Vorschau, Versionen, Status und Kommentare`}
        actions={<Badge tone="gray">{documents.filter((d) => d.status === "NEW").length} neu</Badge>}
      />

      {can(role, "documents.create") ? (
        <UploadDropzone clientId={clientId || null} compact />
      ) : null}

      <Card>
        <CardContent className="pt-4">
          <form className="flex flex-wrap gap-2 mb-4" method="get">
            <select name="status" defaultValue={status} aria-label="Status filtern" className="h-9 rounded-lg border border-border bg-card px-2 text-sm">
              <option value="">Alle Status</option>
              {Object.entries(DOCUMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select name="category" defaultValue={category} aria-label="Kategorie filtern" className="h-9 rounded-lg border border-border bg-card px-2 text-sm">
              <option value="">Alle Kategorien</option>
              {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select name="client" defaultValue={clientId} aria-label="Mandant filtern" className="h-9 rounded-lg border border-border bg-card px-2 text-sm">
              <option value="">Alle Mandanten</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="h-9 px-3 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover">Filtern</button>
            <a href="/documents" className="h-9 px-3 rounded-lg border border-border text-sm leading-9 hover:bg-accent/50">Zurücksetzen</a>
          </form>
          <DocumentsTable documents={rows} showClient />
        </CardContent>
      </Card>
    </div>
  );
}

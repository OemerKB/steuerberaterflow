import { formatBytes, formatDate, DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_TONES } from "./labels";

/** Server-seitiges Mapping einer Dokumentzeile für die DocumentsTable (client). */
export function mapDocumentRow(doc) {
  return {
    id: doc.id,
    title: doc.title,
    clientName: doc.client?.name || "–",
    categoryLabel: DOCUMENT_CATEGORY_LABELS[doc.category] || doc.category,
    statusLabel: DOCUMENT_STATUS_LABELS[doc.status],
    statusTone: DOCUMENT_STATUS_TONES[doc.status] || "gray",
    period: [doc.month ? String(doc.month).padStart(2, "0") : null, doc.taxYear].filter(Boolean).join("/") || "",
    uploadedBy: doc.uploadedBy?.name || (doc.uploadedById === null && doc.client ? "Mandant" : "–"),
    sizeLabel: formatBytes(doc.versions?.[0]?.sizeBytes),
    createdAtLabel: formatDate(doc.createdAt),
  };
}

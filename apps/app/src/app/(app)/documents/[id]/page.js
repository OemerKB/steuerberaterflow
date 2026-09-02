import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input, Label, Textarea, NativeSelect } from "@steuerberaterflow/ui";
import { DocumentActions, DocumentCommentForm, DocumentVersionUpload } from "./document-client";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_TONES, formatDateTime, formatBytes } from "@/lib/labels";
import { isPreviewable } from "@/lib/workflow";
import Link from "next/link";

export const metadata = { title: "Dokument" };

export default async function DocumentDetailPage({ params }) {
  const { id } = await params;
  const { user, role, organization } = await requireFirmContext();

  const doc = await prisma.document.findFirst({
    where: { id, organizationId: organization.id },
    include: {
      client: { select: { id: true, name: true } },
      uploadedBy: { select: { name: true } },
      versions: { orderBy: { version: "desc" }, include: { uploadedBy: { select: { name: true } } } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!doc) notFound();

  const latest = doc.versions[0];
  const previewable = latest && isPreviewable(latest.mimeType);
  const canEdit = can(role, "documents.update");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
            <Badge tone={DOCUMENT_STATUS_TONES[doc.status]}>{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">
            {doc.client ? <Link href={`/clients/${doc.client.id}`} className="sf-link">{doc.client.name}</Link> : "Ohne Mandantenzuordnung"}
            {" · "}{DOCUMENT_CATEGORY_LABELS[doc.category]} · {formatDateTime(doc.createdAt)} · {formatBytes(latest?.sizeBytes)}
            {doc.uploadedBy ? ` · von ${doc.uploadedBy.name}` : doc.uploadedById === null ? " · vom Mandanten" : ""}
          </p>
        </div>
        {canEdit ? <DocumentActions documentId={doc.id} currentStatus={doc.status} clientId={doc.clientId} /> : null}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Vorschau */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
            <CardDescription>{latest ? `${latest.fileName} · Version ${latest.version}` : "Keine Datei"}</CardDescription>
          </CardHeader>
          <CardContent>
            {previewable ? (
              <iframe
                src={`/api/documents/${doc.id}/file`}
                title={`Vorschau: ${doc.title}`}
                className="w-full h-[520px] rounded-lg border border-border bg-white"
              />
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted mb-3">Für diesen Dateityp ist keine Inline-Vorschau verfügbar.</p>
                <a href={`/api/documents/${doc.id}/file?download=1`} className="text-sm sf-link">Datei herunterladen</a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadaten + Versionen */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Metadaten</CardTitle></CardHeader>
            <CardContent>
              {canEdit ? (
                <form action={`/api/documents/${doc.id}/metadata`} method="post" className="hidden" />
              ) : null}
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-muted">Kategorie</dt><dd>{DOCUMENT_CATEGORY_LABELS[doc.category]}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Steuerjahr</dt><dd>{doc.taxYear ?? "–"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Monat</dt><dd>{doc.month ?? "–"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Tags</dt><dd>{doc.tags.length ? doc.tags.join(", ") : "–"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">Prüfsumme</dt><dd className="font-mono text-[10px] truncate max-w-32">{latest?.checksum?.slice(0, 16)}…</dd></div>
              </dl>
              {doc.description ? <p className="text-xs text-muted mt-3 border-t border-border pt-3">{doc.description}</p> : null}
            </CardContent>
          </Card>

          {canEdit ? <DocumentVersionUpload documentId={doc.id} /> : null}

          <Card>
            <CardHeader><CardTitle>Versionen</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {doc.versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span>Version {v.version} · {formatBytes(v.sizeBytes)}</span>
                  <span className="text-xs text-muted">{v.uploadedBy?.name || "Mandant"} · {formatDateTime(v.createdAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kommentare */}
      <Card>
        <CardHeader><CardTitle>Kommentare ({doc.comments.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {doc.comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{c.author.name}</p>
                <span className="text-[11px] text-muted">{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{c.content}</p>
              {c.isInternal ? <Badge tone="amber" className="mt-1.5">intern</Badge> : null}
            </div>
          ))}
          {canEdit ? <DocumentCommentForm documentId={doc.id} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

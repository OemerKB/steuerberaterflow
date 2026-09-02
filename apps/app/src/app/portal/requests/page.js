import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { PortalItemRow } from "./portal-item-row";
import { REQUEST_STATUS_LABELS, formatDate } from "@/lib/labels";
import { requestProgress } from "@/lib/workflow";

export const metadata = { title: "Unterlagen" };

export default async function PortalRequestsPage() {
  const { client } = await requireClientContext();

  const requests = await prisma.documentRequest.findMany({
    where: { organizationId: client.organizationId, clientId: client.id, status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { items: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const totalMissing = requests.reduce((acc, r) => acc + requestProgress(r).missing, 0);
  const total = requests.reduce((acc, r) => acc + r.items.length, 0);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Fehlende Unterlagen</CardTitle>
          <p className="text-xs text-muted mt-1">
            {requests.length === 0
              ? "Keine offenen Anforderungen."
              : totalMissing === 0
                ? "Alle angeforderten Unterlagen liegen vor – vielen Dank!"
                : `Von ${total} angeforderten Unterlagen fehlen noch ${totalMissing}.`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <EmptyState title="Nichts zu tun" description="Die Kanzlei hat derzeit keine Unterlagen angefordert." />
          ) : (
            requests.map((request) => {
              const progress = requestProgress(request);
              return (
                <div key={request.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{request.title}</p>
                      <p className="text-xs text-muted">
                        {request.periodLabel ? `${request.periodLabel} · ` : ""}
                        {request.dueDate ? `bis ${formatDate(request.dueDate)}` : "ohne Frist"}
                      </p>
                    </div>
                    <Badge tone={progress.missing === 0 ? "green" : "amber"}>
                      {progress.missing === 0 ? "vollständig" : `${progress.missing} von ${progress.total} fehlen`}
                    </Badge>
                  </div>
                  {request.description ? <p className="text-xs text-muted mt-1.5">{request.description}</p> : null}
                  <div className="mt-2 h-1.5 rounded-full bg-accent/50 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {request.items.map((item) => (
                      <PortalItemRow key={item.id} item={{ id: item.id, title: item.title, status: item.status, dueDate: item.dueDate, hasDocument: Boolean(item.documentId) }} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-2">Datei hochladen (allgemein)</h2>
        <UploadDropzone clientId={client.id} compact />
      </div>
    </div>
  );
}

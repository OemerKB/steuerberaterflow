import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from "@steuerberaterflow/ui";
import { AddNoteForm } from "../forms";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Notizen" };

export default async function ClientNotesPage({ params }) {
  const { clientId } = await params;
  const { organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organization.id },
    include: { notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } } },
  });
  if (!client) notFound();

  return (
    <div className="grid lg:grid-cols-2 gap-5 max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Notizen ({client.notes.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {client.notes.length === 0 ? (
            <EmptyState title="Keine Notizen" description="Interne Notizen zur Mandantenakte." />
          ) : (
            client.notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-border p-3">
                <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                <p className="text-[11px] text-muted mt-1.5">{n.author?.name || "System"} · {formatDateTime(n.createdAt)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Neue Notiz</CardTitle></CardHeader>
        <CardContent><AddNoteForm clientId={client.id} /></CardContent>
      </Card>
    </div>
  );
}

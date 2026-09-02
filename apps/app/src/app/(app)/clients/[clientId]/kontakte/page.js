import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { AddContactForm } from "../forms";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Ansprechpartner" };

export default async function ClientContactsPage({ params }) {
  const { clientId } = await params;
  const { organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organization.id },
    include: { contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] } },
  });
  if (!client) notFound();

  return (
    <div className="grid lg:grid-cols-2 gap-5 max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Ansprechpartner ({client.contacts.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {client.contacts.length === 0 ? (
            <EmptyState title="Noch keine Kontakte" description="Fügen Sie den ersten Ansprechpartner hinzu." />
          ) : (
            client.contacts.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.isPrimary ? <Badge tone="green">primär</Badge> : null}
                </div>
                {c.role ? <p className="text-xs text-muted">{c.role}</p> : null}
                <p className="text-xs text-muted mt-1">{[c.email, c.phone].filter(Boolean).join(" · ") || "keine Kontaktdaten"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ansprechpartner hinzufügen</CardTitle></CardHeader>
        <CardContent><AddContactForm clientId={client.id} /></CardContent>
      </Card>
    </div>
  );
}

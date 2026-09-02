import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { PageHeader, Card, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { NewMessageDialog } from "@/components/new-message-dialog";
import { formatDateTime } from "@/lib/labels";
import Link from "next/link";

export const metadata = { title: "Nachrichten" };

export default async function MessagesPage({ searchParams }) {
  const { user, role, organization } = await requireFirmContext();
  const params = await searchParams;
  const type = params?.type === "internal" ? "INTERNAL" : params?.type === "client" ? "CLIENT" : "";

  const conversations = await prisma.conversation.findMany({
    where: {
      organizationId: organization.id,
      ...(type ? { type } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      reads: { where: { userId: user.id } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nachrichten"
        description="Sichere Konversationen mit Mandanten – interne Kanzleinotizen sind niemals für Mandanten sichtbar."
        actions={can(role, "messages.send") ? <NewMessageDialog clients={clients} /> : null}
      />

      <div className="flex gap-2">
        <Link href="/messages" className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${!type ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:bg-accent/40"}`}>Alle</Link>
        <Link href="/messages?type=client" className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${type === "CLIENT" ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:bg-accent/40"}`}>Mandanten</Link>
        <Link href="/messages?type=internal" className={`h-8 px-3 inline-flex items-center rounded-lg border text-xs font-medium ${type === "INTERNAL" ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:bg-accent/40"}`}>Interne Notizen</Link>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-2">
          {conversations.length === 0 ? (
            <EmptyState title="Keine Konversationen" description="Starten Sie eine Nachricht an einen Mandanten oder eine interne Notiz." />
          ) : (
            conversations.map((c) => {
              const last = c.messages[0];
              const isUnread = last && (!c.reads[0] || last.createdAt > c.reads[0].lastReadAt) && last.senderId !== user.id;
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className={`flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30 ${c.archivedAt ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isUnread ? <span className="h-2 w-2 rounded-full bg-primary shrink-0" /> : null}
                      <p className="text-sm font-medium truncate">{c.subject}</p>
                      {c.type === "INTERNAL" ? <Badge tone="amber">intern</Badge> : null}
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {c.client?.name ? `${c.client.name} · ` : "Interne Notiz · "}
                      {last ? `${last.authorName || "Mandant"}: ${last.content.slice(0, 80)}` : "leer"}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted shrink-0">{formatDateTime(c.lastMessageAt)}</span>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

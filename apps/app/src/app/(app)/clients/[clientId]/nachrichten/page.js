import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@steuerberaterflow/ui";
import { NewMessageDialog } from "@/components/new-message-dialog";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Nachrichten der Akte" };

export default async function ClientMessagesPage({ params }) {
  const { clientId } = await params;
  const { user, role, organization } = await requireFirmContext();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
  if (!client) notFound();

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: organization.id, clientId },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      reads: { where: { userId: user.id } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>Konversationen ({conversations.length})</CardTitle>
        {can(role, "messages.send") ? (
          <NewMessageDialog clients={[{ id: client.id, name: client.name }]} defaultClientId={client.id} />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {conversations.length === 0 ? (
          <EmptyState title="Keine Nachrichten" description="Starten Sie eine sichere Konversation mit dem Mandanten." />
        ) : (
          conversations.map((c) => {
            const last = c.messages[0];
            const unread = !c.reads[0] || (last && last.createdAt > c.reads[0].lastReadAt);
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className={`flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent/30 ${c.archivedAt ? "opacity-60" : ""}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {unread && last?.senderId === null ? <span className="h-2 w-2 rounded-full bg-primary shrink-0" /> : null}
                    <p className="text-sm font-medium truncate">{c.subject}</p>
                    {c.type === "INTERNAL" ? <Badge tone="amber">intern</Badge> : null}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {last ? `${last.authorName || "Mandant"}: ${last.content}` : "Keine Nachrichten"}
                  </p>
                </div>
                <span className="text-[11px] text-muted shrink-0">{formatDateTime(c.lastMessageAt)}</span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

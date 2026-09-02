import { prisma } from "@/lib/db";
import { requireClientContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from "@steuerberaterflow/ui";
import { PortalMessageForm } from "./portal-message-form";
import { formatDateTime } from "@/lib/labels";
import Link from "next/link";

export const metadata = { title: "Nachrichten" };

export default async function PortalMessagesPage({ searchParams }) {
  const { client } = await requireClientContext();
  const params = await searchParams;
  const openId = params?.c || "";

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: client.organizationId, clientId: client.id, type: "CLIENT", archivedAt: null },
    include: {
      messages: { where: { isInternal: false }, orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const active = conversations.find((c) => c.id === openId) || conversations[0];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Konversationen ({conversations.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted text-center py-2">Noch keine Nachrichten.</p>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.id}
                href={`/portal/messages?c=${c.id}`}
                className={`block rounded-lg border px-3 py-2 hover:bg-accent/30 ${active?.id === c.id ? "border-primary bg-accent/30" : "border-border"}`}
              >
                <p className="text-sm font-medium truncate">{c.subject}</p>
                <p className="text-[11px] text-muted">{formatDateTime(c.lastMessageAt)}</p>
              </Link>
            ))
          )}
          <PortalMessageForm />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{active ? active.subject : "Keine Konversation gewählt"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!active ? (
            <EmptyState title="Starten Sie eine Nachricht" description="Schreiben Sie Ihrer Kanzlei – sicher und zentral." />
          ) : (
            <>
              <div className="space-y-3 max-h-[420px] overflow-y-auto sf-scroll">
                {active.messages.map((m) => {
                  const fromClient = m.senderId === null;
                  return (
                    <div key={m.id} className={`flex ${fromClient ? "justify-end" : ""}`}>
                      <div className={`max-w-[80%] rounded-lg border px-3 py-2 ${fromClient ? "bg-accent/30 border-accent" : "bg-card border-border"}`}>
                        <p className="text-[10px] text-muted">{m.sender?.name || client.name} · {formatDateTime(m.createdAt)}</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <PortalMessageForm conversationId={active.id} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from "@steuerberaterflow/ui";
import { MessageForm } from "./message-form";
import { formatDateTime } from "@/lib/labels";
import Link from "next/link";

export const metadata = { title: "Konversation" };

export default async function ConversationPage({ params }) {
  const { id } = await params;
  const { user, role, organization } = await requireFirmContext();

  const conversation = await prisma.conversation.findFirst({
    where: { id, organizationId: organization.id },
    include: {
      client: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } },
    },
  });
  if (!conversation) notFound();

  await prisma.messageRead.upsert({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    create: { conversationId: id, userId: user.id },
    update: { lastReadAt: new Date() },
  });

  const isInternal = conversation.type === "INTERNAL";

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{conversation.subject}</h1>
          {isInternal ? <Badge tone="amber">Interne Kanzleinotiz</Badge> : null}
        </div>
        <p className="text-sm text-muted mt-0.5">
          {conversation.client ? (
            <>Mandant: <Link href={`/clients/${conversation.client.id}`} className="sf-link">{conversation.client.name}</Link></>
          ) : (
            "Interne Diskussion"
          )}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Verlauf ({conversation.messages.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {conversation.messages.map((m) => {
            const fromClient = m.senderId === null;
            return (
              <div key={m.id} className={`flex gap-2.5 ${m.senderId === user.id ? "flex-row-reverse" : ""}`}>
                <Avatar name={m.authorName || "Mandant"} size="sm" />
                <div className={`max-w-[75%] rounded-lg border px-3 py-2 ${fromClient ? "bg-accent/30 border-accent" : "bg-card border-border"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{m.authorName || conversation.client?.name || "Mandant"}</p>
                    {m.isInternal && !isInternal ? <Badge tone="amber">intern</Badge> : null}
                    <span className="text-[10px] text-muted">{formatDateTime(m.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {can(role, "messages.send") ? (
        <div className="mt-4">
          <MessageForm conversationId={conversation.id} allowInternal={!isInternal && role !== "ACCOUNTANT"} />
        </div>
      ) : null}
    </div>
  );
}

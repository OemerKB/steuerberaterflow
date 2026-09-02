"use server";

import { revalidatePath } from "next/cache";
import { messageSchema, conversationStartSchema } from "@steuerberaterflow/validation";
import { prisma } from "@/lib/db";
import { guard, guardPortal } from "@/lib/context";
import { logAudit, createNotification } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";

/** Interne Notizen (type INTERNAL) sind NIE für Mandanten sichtbar – serverseitig erzwungen. */
export async function startConversationAction(prevState, formData) {
  const { user, organization } = await guard("messages.send");
  const clientId = String(formData.get("clientId") || "") || null;
  const isInternal = formData.get("isInternal") === "on";

  const parsed = conversationStartSchema.safeParse({
    clientId,
    subject: formData.get("subject") || "",
    content: formData.get("content") || "",
    isInternal,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (parsed.data.isInternal && !clientId) return { error: "Interne Notizen benötigen einen Mandantenbezug." };

  const conversation = await prisma.conversation.create({
    data: {
      organizationId: organization.id,
      clientId,
      type: parsed.data.isInternal ? "INTERNAL" : "CLIENT",
      subject: parsed.data.subject,
      createdById: user.id,
      messages: {
        create: {
          senderId: user.id,
          authorName: user.name,
          content: parsed.data.content,
          isInternal: parsed.data.isInternal,
        },
      },
    },
  });
  await prisma.messageRead.create({
    data: { conversationId: conversation.id, userId: user.id },
  });

  if (clientId && !parsed.data.isInternal) {
    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: organization.id } });
    if (client?.portalUserId) {
      await createNotification({
        organizationId: organization.id,
        userId: client.portalUserId,
        type: "message",
        title: "Neue Nachricht der Kanzlei",
        body: parsed.data.subject,
        link: `/portal/messages/${conversation.id}`,
      });
    }
  }

  await logAudit({
    organizationId: organization.id,
    actorId: user.id,
    actorName: user.name,
    action: parsed.data.isInternal ? "conversation.internal_created" : "conversation.created",
    entityType: "Conversation",
    entityId: conversation.id,
  });
  revalidatePath("/messages");
  return { success: parsed.data.isInternal ? "Interne Notiz erstellt (nicht für Mandant sichtbar)." : "Nachricht gesendet.", conversationId: conversation.id };
}

export async function sendMessageAction(prevState, formData) {
  const { user, organization, role } = await guard("messages.send");
  const parsed = messageSchema.safeParse({
    conversationId: formData.get("conversationId") || "",
    content: formData.get("content") || "",
    isInternal: formData.get("isInternal") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.data.conversationId, organizationId: organization.id },
  });
  if (!conversation) return { error: "Konversation nicht gefunden." };
  if (conversation.type === "CLIENT" && parsed.data.isInternal && role === "ACCOUNTANT") {
    return { error: "Externe Buchhalter können keine internen Notizen erstellen." };
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      authorName: user.name,
      content: parsed.data.content,
      isInternal: parsed.data.isInternal && conversation.type === "CLIENT",
    },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });
  await prisma.messageRead.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: user.id } },
    create: { conversationId: conversation.id, userId: user.id },
    update: { lastReadAt: new Date() },
  });

  if (conversation.type === "CLIENT" && !(parsed.data.isInternal && conversation.type === "CLIENT")) {
    const client = await prisma.client.findFirst({ where: { id: conversation.clientId } });
    if (client?.portalUserId) {
      await createNotification({
        organizationId: organization.id,
        userId: client.portalUserId,
        type: "message",
        title: "Neue Nachricht der Kanzlei",
        body: conversation.subject,
        link: `/portal/messages/${conversation.id}`,
      });
    }
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversation.id}`);
  return { success: "Nachricht gesendet." };
}

export async function markConversationReadAction(formData) {
  const { user, organization } = await guard("messages.read");
  const conversationId = String(formData.get("conversationId") || "");
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId: organization.id },
  });
  if (!conversation) return { error: "Konversation nicht gefunden." };
  await prisma.messageRead.upsert({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    create: { conversationId, userId: user.id },
    update: { lastReadAt: new Date() },
  });
  return { success: true };
}

export async function archiveConversationAction(formData) {
  const { user, organization } = await guard("messages.read");
  const conversationId = String(formData.get("conversationId") || "");
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId: organization.id },
  });
  if (!conversation) return { error: "Konversation nicht gefunden." };
  const archivedAt = conversation.archivedAt ? null : new Date();
  await prisma.conversation.update({ where: { id: conversationId }, data: { archivedAt } });
  revalidatePath("/messages");
  return { success: archivedAt ? "Archiviert." : "Wiederhergestellt." };
}

/* ------------------------------ Portal-Messaging --------------------------- */

export async function portalSendMessageAction(prevState, formData) {
  const { user, client } = await guardPortal("portal.messages.send");
  const limit = rateLimit({ key: `portal-msg:${user.id}`, limit: 20, windowMs: 60 * 1000 });
  if (!limit.allowed) return { error: "Bitte einen Moment warten und erneut senden." };

  const conversationId = String(formData.get("conversationId") || "") || null;
  const content = String(formData.get("content") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  if (!content) return { error: "Bitte Nachricht eingeben." };

  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: client.organizationId, clientId: client.id, type: "CLIENT" },
    });
    if (!conversation) return { error: "Konversation nicht gefunden." };
  } else {
    if (subject.length < 3) return { error: "Bitte Betreff angeben." };
    conversation = await prisma.conversation.create({
      data: {
        organizationId: client.organizationId,
        clientId: client.id,
        type: "CLIENT",
        subject,
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: null,
      authorName: client.name,
      content,
      isInternal: false,
    },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  // Kanzlei-Team benachrichtigen
  const { notifyOrgMembers } = await import("@/lib/audit");
  await notifyOrgMembers({
    organizationId: client.organizationId,
    roles: ["OWNER", "STAFF"],
    type: "message",
    title: "Neue Mandantennachricht",
    body: `${client.name}: ${conversation.subject}`,
    link: `/messages/${conversation.id}`,
  });

  await logAudit({
    organizationId: client.organizationId,
    actorId: user.id,
    actorName: client.name,
    action: "message.sent_by_client",
    entityType: "Conversation",
    entityId: conversation.id,
  });

  revalidatePath("/portal/messages");
  revalidatePath("/portal");
  revalidatePath("/messages");
  return { success: "Nachricht an die Kanzlei gesendet.", conversationId: conversation.id };
}

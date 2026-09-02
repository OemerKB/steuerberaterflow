"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea, Button } from "@steuerberaterflow/ui";
import { portalSendMessageAction } from "@/actions/messages";

export function PortalMessageForm({ conversationId = null }) {
  const [state, formAction, pending] = useActionState(portalSendMessageAction, {});
  const router = useRouter();
  const formRef = useRef(null);
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      if (!conversationId && state.conversationId) {
        router.push(`/portal/messages?c=${state.conversationId}`);
      } else {
        router.refresh();
      }
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2 pt-2 border-t border-border">
      {conversationId ? <input type="hidden" name="conversationId" value={conversationId} /> : null}
      {!conversationId ? (
        <input name="subject" required minLength={3} placeholder="Betreff" className="w-full h-9 rounded-lg border border-border px-3 text-sm" />
      ) : null}
      <Textarea name="content" required rows={3} placeholder="Ihre Nachricht an die Kanzlei…" aria-label="Nachricht" />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Senden…" : "Senden"}</Button>
      </div>
    </form>
  );
}

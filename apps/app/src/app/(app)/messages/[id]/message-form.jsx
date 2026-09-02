"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea, Button, Checkbox } from "@steuerberaterflow/ui";
import { sendMessageAction } from "@/actions/messages";

export function MessageForm({ conversationId, allowInternal }) {
  const [state, formAction, pending] = useActionState(sendMessageAction, {});
  const router = useRouter();
  const formRef = useRef(null);
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <Textarea name="content" required rows={3} placeholder="Nachricht schreiben…" aria-label="Nachricht" />
      <div className="flex items-center justify-between gap-2">
        {allowInternal ? (
          <Checkbox name="isInternal" label="Interne Notiz (Mandant sieht dies nicht)" />
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Senden…" : "Senden"}</Button>
      </div>
    </form>
  );
}

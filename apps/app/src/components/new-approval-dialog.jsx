"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Label, Textarea, NativeSelect, Input, FieldError } from "@steuerberaterflow/ui";
import { Plus } from "lucide-react";
import { createApprovalRequestAction } from "@/actions/workflow-extra";
import { APPROVAL_KIND_LABELS } from "@/lib/labels";

/** Dialog: Freigabe anfordern (Dokumentprüfung, Bestätigungen). */
export function NewApprovalDialog({ clients, documents = [], defaultClientId = null, defaultDocumentId = null, trigger }) {
  const [state, formAction, pending] = useActionState(createApprovalRequestAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button size="sm"><Plus className="h-3.5 w-3.5" /> Freigabe anfordern</Button>}
      </DialogTrigger>
      <DialogContent
        title="Freigabe anfordern"
        description="Mandant wird gebeten, ein Dokument oder Ergebnis zu bestätigen (keine qualifizierte elektronische Signatur)."
      >
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="ap-client">Mandant *</Label>
            <NativeSelect id="ap-client" name="clientId" required defaultValue={defaultClientId || ""}>
              <option value="">– bitte wählen –</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="ap-doc">Dokument (optional)</Label>
            <NativeSelect id="ap-doc" name="documentId" defaultValue={defaultDocumentId || ""}>
              <option value="">– ohne Dokument –</option>
              {documents.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="ap-kind">Art</Label>
            <NativeSelect id="ap-kind" name="kind" defaultValue="DOCUMENT">
              {Object.entries(APPROVAL_KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="ap-title">Titel *</Label>
            <Input id="ap-title" name="title" required minLength={3} placeholder="z. B. Steuererklärung 2025 zur Freigabe" />
          </div>
          <div>
            <Label htmlFor="ap-msg">Nachricht an Mandant</Label>
            <Textarea id="ap-msg" name="message" rows={2} placeholder="Kurze Erläuterung, was geprüft werden soll…" />
          </div>
          <div>
            <Label htmlFor="ap-due">Fälligkeit</Label>
            <Input id="ap-due" name="dueDate" type="date" />
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Senden…" : "Anfordern"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

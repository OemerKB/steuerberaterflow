"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Dialog, DialogTrigger, DialogContent, Label, Textarea, NativeSelect, Checkbox } from "@steuerberaterflow/ui";
import { Pencil, Upload } from "lucide-react";
import {
  updateDocumentAction,
  setDocumentStatusAction,
  addDocumentCommentAction,
  uploadDocumentVersionAction,
} from "@/actions/documents";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/labels";
import { NewRequestDialog } from "@/components/new-request-dialog";

/** Status-Wechsel + Metadaten-Dialog + Rückfrage starten. */
export function DocumentActions({ documentId, currentStatus, clientId }) {
  const router = useRouter();

  async function changeStatus(status) {
    const formData = new FormData();
    formData.set("documentId", documentId);
    formData.set("status", status);
    const res = await setDocumentStatusAction(formData);
    if (res?.error) toast.error(res.error);
    else if (res?.success) {
      toast.success(res.success);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="Status ändern"
        defaultValue={currentStatus}
        onChange={(e) => changeStatus(e.target.value)}
        className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
      >
        {Object.entries(DOCUMENT_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <EditDocumentDialog documentId={documentId} currentStatus={currentStatus} clientId={clientId} />
      {clientId ? (
        <NewRequestDialog
          clients={[{ id: clientId, name: "" }]}
          defaultClientId={clientId}
          trigger={<Button variant="secondary" size="sm" type="button">Rückfrage</Button>}
        />
      ) : null}
    </div>
  );
}

function EditDocumentDialog({ documentId, currentStatus, clientId }) {
  const [state, formAction, pending] = useActionState(updateDocumentAction, {});
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
        <Button variant="secondary" size="sm"><Pencil className="h-3.5 w-3.5" /> Metadaten</Button>
      </DialogTrigger>
      <DialogContent title="Dokument bearbeiten" description="Titel, Kategorie, Periode und Tags anpassen.">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="documentId" value={documentId} />
          <div>
            <Label htmlFor="ed-title">Titel</Label>
            <input id="ed-title" name="title" required minLength={2} className="w-full h-9 rounded-lg border border-border px-3 text-sm" defaultValue="" placeholder="Titel" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ed-category">Kategorie</Label>
              <NativeSelect id="ed-category" name="category" defaultValue="">
                <option value="">– unverändert –</option>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="ed-status">Status</Label>
              <NativeSelect id="ed-status" name="status" defaultValue={currentStatus}>
                {Object.entries(DOCUMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ed-year">Steuerjahr</Label>
              <input id="ed-year" name="taxYear" type="number" min="2000" max="2100" className="w-full h-9 rounded-lg border border-border px-3 text-sm" />
            </div>
            <div>
              <Label htmlFor="ed-month">Monat</Label>
              <NativeSelect id="ed-month" name="month" defaultValue="">
                <option value="">–</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
              </NativeSelect>
            </div>
          </div>
          <div>
            <Label htmlFor="ed-tags">Tags (Komma-getrennt)</Label>
            <input id="ed-tags" name="tags" className="w-full h-9 rounded-lg border border-border px-3 text-sm" placeholder="wichtig, august" />
          </div>
          <div>
            <Label htmlFor="ed-desc">Beschreibung</Label>
            <Textarea id="ed-desc" name="description" rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Speichern"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentCommentForm({ documentId }) {
  const [state, formAction, pending] = useActionState(addDocumentCommentAction, {});
  const router = useRouter();
  const formRef = useRef(null);
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="documentId" value={documentId} />
      <Textarea name="content" required rows={2} placeholder="Kommentar schreiben…" />
      <div className="flex items-center justify-between">
        <Checkbox name="isInternal" label="Intern (nicht für Mandanten sichtbar)" />
        <Button type="submit" size="sm" disabled={pending}>{pending ? "…" : "Kommentieren"}</Button>
      </div>
    </form>
  );
}

export function DocumentVersionUpload({ documentId }) {
  const [state, formAction, pending] = useActionState(uploadDocumentVersionAction, {});
  const router = useRouter();
  const formRef = useRef(null);
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="documentId" value={documentId} />
      <Label htmlFor="dv-file">Neue Version hochladen</Label>
      <input id="dv-file" name="file" type="file" required className="w-full text-sm" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        <Upload className="h-3.5 w-3.5" /> {pending ? "Lädt…" : "Version hochladen"}
      </Button>
    </form>
  );
}

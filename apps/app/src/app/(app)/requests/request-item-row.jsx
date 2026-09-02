"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateRequestItemAction } from "@/actions/requests";
import { Badge } from "@steuerberaterflow/ui";
import { REQUEST_ITEM_STATUS_LABELS, formatDate } from "@/lib/labels";
import { FileUp, Check, Ban } from "lucide-react";

const TONES = { MISSING: "red", UPLOADED: "amber", ACCEPTED: "green", WAIVED: "gray" };

/** Eine angeforderte Unterlage mit Statuswechsel. */
export function RequestItemRow({ item, canManage }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(status) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("itemId", item.id);
      formData.set("status", status);
      const res = await updateRequestItemAction(formData);
      if (res?.error) toast.error(res.error);
      else if (res?.success) {
        toast.success(res.success);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/80 px-2.5 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{item.title}</p>
        {item.dueDate ? <p className="text-[11px] text-muted">bis {formatDate(item.dueDate)}</p> : null}
      </div>
      {item.documentId ? (
        <a href={`/api/documents/${item.documentId}/file`} target="_blank" rel="noreferrer" className="text-xs sf-link">
          Datei ansehen
        </a>
      ) : null}
      <Badge tone={TONES[item.status]}>{REQUEST_ITEM_STATUS_LABELS[item.status]}</Badge>
      {canManage && item.status === "UPLOADED" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("ACCEPTED")}
          className="text-xs px-2 h-6 rounded-md bg-accent text-accent-foreground hover:bg-accent/70 cursor-pointer"
          title="Als geprüft markieren"
        >
          <Check className="h-3 w-3 inline -mt-0.5" /> Geprüft
        </button>
      ) : null}
      {canManage && item.status === "MISSING" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("WAIVED")}
          className="text-xs px-2 h-6 rounded-md border border-border text-muted hover:bg-accent/50 cursor-pointer"
          title="Als nicht erforderlich markieren"
        >
          <Ban className="h-3 w-3 inline -mt-0.5" /> Entfällt
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@steuerberaterflow/ui";
import { UploadCloud } from "lucide-react";
import { portalUploadDocumentsAction } from "@/actions/documents";
import { formatDate } from "@/lib/labels";

const TONES = { MISSING: "red", UPLOADED: "amber", ACCEPTED: "green", WAIVED: "gray" };
const LABELS = { MISSING: "fehlt", UPLOADED: "eingegangen", ACCEPTED: "geprüft", WAIVED: "entfällt" };

/** Eine angeforderte Unterlage mit direktem Upload. */
export function PortalItemRow({ item }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef(null);

  function upload(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Die Datei ist größer als 10 MB.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestItemId", item.id);
      formData.append("files", file);
      const res = await portalUploadDocumentsAction({}, formData);
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
      <Badge tone={TONES[item.status]}>{LABELS[item.status]}</Badge>
      {item.status === "MISSING" ? (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip"
            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 text-xs font-medium h-7 px-2 rounded-md bg-primary text-white hover:bg-primary-hover cursor-pointer"
          >
            <UploadCloud className="h-3 w-3" /> {pending ? "…" : "Hochladen"}
          </button>
        </>
      ) : null}
    </div>
  );
}

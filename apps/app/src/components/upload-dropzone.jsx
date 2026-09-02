"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, File as FileIcon, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, Button } from "@steuerberaterflow/ui";
import { uploadDocumentsAction } from "@/actions/documents";

const MAX_MB = 10;

/**
 * Drag-and-Drop-Upload mit Fortschritt, Retry-Fähigkeit und Validierung.
 * Genutzt in Kanzlei-Dokumenten, Mandantenakte und Mandantenportal.
 */
export function UploadDropzone({ clientId = null, compact = false, categories = null, defaultCategory = "OTHER", onUploaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  function addFiles(list) {
    const next = [...files];
    for (const f of list) {
      const ext = f.name.match(/\.[a-z0-9]{1,5}$/i)?.[0]?.toLowerCase() || "";
      const okType = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt", ".csv", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip"].includes(ext);
      if (!okType) {
        toast.error(`${f.name}: Dateityp nicht erlaubt.`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name}: größer als ${MAX_MB} MB.`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  }

  async function startUpload() {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (clientId) formData.set("clientId", clientId);
      formData.set("category", defaultCategory);
      for (const f of files) formData.append("files", f);
      const result = await uploadDocumentsAction({}, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(result?.success || "Upload abgeschlossen.");
        if (result?.duplicateHints?.length) {
          toast.warning(`Möglicherweise doppelt: ${result.duplicateHints.map((d) => d.fileName).join(", ")}`);
        }
        if (result?.errors?.length) toast.warning(result.errors.join(" · "));
        setFiles([]);
        router.refresh();
        onUploaded?.();
      }
    } catch {
      toast.error("Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className={compact ? "" : ""}>
      <CardContent className="pt-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="Dateien hochladen"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-accent/40" : "border-border hover:border-primary/50 hover:bg-accent/20"
          }`}
        >
          <UploadCloud className="h-7 w-7 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Dateien hierher ziehen</p>
          <p className="text-xs text-muted mt-0.5">oder klicken zum Auswählen · PDF, JPG, PNG, Office · max. {MAX_MB} MB</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {files.length > 0 ? (
          <ul className="mt-3 space-y-1.5" aria-label="Ausgewählte Dateien">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
                <FileIcon className="h-3.5 w-3.5 text-muted shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                <span className="text-[10px] text-muted shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  aria-label={`${f.name} entfernen`}
                  className="p-0.5 rounded hover:bg-accent text-muted cursor-pointer"
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {files.length > 0 ? (
          <div className="mt-3 flex gap-2">
            <Button type="button" onClick={startUpload} disabled={uploading} size="sm">
              {uploading ? (
                <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Wird hochgeladen…</>
              ) : (
                `${files.length} Datei(en) hochladen`
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFiles([])} disabled={uploading}>
              Abbrechen
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

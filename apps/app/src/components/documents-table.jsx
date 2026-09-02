"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { Badge } from "@steuerberaterflow/ui";
import { FileText, Eye, Download } from "lucide-react";

/**
 * Wiederverwendbare Dokumententabelle (Kanzleiweit, Mandantenakte, Belege).
 */
export function DocumentsTable({ documents, showClient = false, emptyTitle = "Keine Dokumente" }) {
  const columns = useMemo(() => {
    const cols = [
      {
        id: "title",
        header: "Dokument",
        accessorKey: "title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-3.5 w-3.5 text-muted shrink-0" />
            <Link href={`/documents/${row.original.id}`} className="font-medium hover:text-primary truncate block max-w-56">
              {row.original.title}
            </Link>
          </div>
        ),
      },
      ...(showClient
        ? [{ id: "client", header: "Mandant", accessorKey: "clientName" }]
        : []),
      { id: "category", header: "Kategorie", accessorKey: "categoryLabel" },
      {
        id: "status",
        header: "Status",
        accessorKey: "statusLabel",
        cell: ({ row }) => <Badge tone={row.original.statusTone}>{row.original.statusLabel}</Badge>,
      },
      {
        id: "period",
        header: "Periode",
        accessorKey: "period",
        cell: ({ row }) => <span className="text-xs text-muted">{row.original.period || "–"}</span>,
      },
      { id: "uploadedBy", header: "Hochgeladen von", accessorKey: "uploadedBy" },
      { id: "size", header: "Größe", accessorKey: "sizeLabel", cell: ({ row }) => <span className="text-xs text-muted">{row.original.sizeLabel}</span> },
      { id: "createdAt", header: "Datum", accessorKey: "createdAtLabel", cell: ({ row }) => <span className="text-xs text-muted">{row.original.createdAtLabel}</span> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex items-center gap-1 justify-end">
            <Link
              href={`/documents/${row.original.id}`}
              className="p-1.5 rounded-md hover:bg-accent text-muted hover:text-foreground"
              aria-label={`Dokument ${row.original.title} öffnen`}
              title="Öffnen"
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
            <a
              href={`/api/documents/${row.original.id}/file?download=1`}
              className="p-1.5 rounded-md hover:bg-accent text-muted hover:text-foreground"
              aria-label={`Dokument ${row.original.title} herunterladen`}
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </span>
        ),
      },
    ];
    return cols;
  }, [showClient]);

  return (
    <DataTable
      columns={columns}
      data={documents}
      searchPlaceholder="Dokument, Mandant, Kategorie…"
      csvFileName="dokumente.csv"
      emptyTitle={emptyTitle}
      emptyDescription="Laden Sie Dokumente hoch oder fordern Sie Unterlagen an."
    />
  );
}

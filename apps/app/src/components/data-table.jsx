"use client";

import { useMemo, useState } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender,
} from "@tanstack/react-table";
import { ArrowUpDown, Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input, Button, NativeSelect, EmptyState } from "@steuerberaterflow/ui";

/**
 * Hochwertige, zugängliche Datentabelle auf Basis von TanStack Table:
 * Suche, Sortierung, Pagination, CSV-Export, optionale Mehrfachauswahl.
 */
export function DataTable({
  columns,
  data,
  searchPlaceholder = "Suchen…",
  csvFileName = "export.csv",
  enableSelection = false,
  selectionActions = null,
  emptyTitle = "Keine Einträge",
  emptyDescription = "Es sind keine Daten vorhanden.",
  initialPageSize = 15,
}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    enableRowSelection: enableSelection,
    initialState: { pagination: { pageSize: initialPageSize } },
  });

  const selectedRows = table.getSelectedRowModel().rows;

  function exportCsv() {
    const cols = columns.filter((c) => c.id && c.id !== "select" && c.accessorKey);
    const header = cols.map((c) => c.header).join(";");
    const rows = table.getFilteredRowModel().rows.map((row) =>
      cols.map((c) => {
        const value = typeof c.accessorFn === "function" ? c.accessorFn(row.original) : row.original[c.accessorKey];
        return String(value ?? "").replace(/;/g, ",");
      }).join(";")
    );
    const csv = "\uFEFF" + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-52 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Tabelle durchsuchen"
            className="pl-8"
          />
        </div>
        <div className="flex-1" />
        {enableSelection && selectedRows.length > 0 && selectionActions ? (
          selectionActions(selectedRows, () => setRowSelection({}))
        ) : null}
        <Button variant="secondary" size="sm" onClick={exportCsv} aria-label="Als CSV exportieren">
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <div className="overflow-x-auto sf-scroll rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted px-3 py-2.5 border-b border-border bg-background/60 whitespace-nowrap">
                    {header.column.getCanSort() ? (
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Sortieren nach ${header.column.id}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-accent/30 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 border-b border-border/70 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getFilteredRowModel().rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted">
          {table.getFilteredRowModel().rows.length} Einträge
        </p>
        <div className="flex items-center gap-2">
          <NativeSelect
            aria-label="Einträge pro Seite"
            className="h-8 text-xs w-14"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </NativeSelect>
          <Button variant="secondary" size="icon" aria-label="Vorherige Seite" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted">
            {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <Button variant="secondary" size="icon" aria-label="Nächste Seite" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

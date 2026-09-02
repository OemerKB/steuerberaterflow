"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { Badge, Button, NativeSelect } from "@steuerberaterflow/ui";
import { toast } from "sonner";
import { archiveClientAction } from "@/actions/clients";
import { formatDate, CLIENT_PROCESS_STATUS } from "@/lib/labels";

/**
 * Mandantentabelle: Suche, Filter, Sortierung, Pagination, Mehrfachauswahl
 * mit Archivieren-Aktion, CSV-Export.
 */
export function ClientsTable({ rows, staff, currentFilter, canArchive }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/clients?${params.toString()}`);
  }

  async function archiveSelected(selected, clear) {
    for (const row of selected) {
      const formData = new FormData();
      formData.set("clientId", row.original.id);
      await archiveClientAction(formData);
    }
    toast.success(`${selected.length} Mandant(en) ${selected.every((r) => r.original.archived) ? "reaktiviert" : "archiviert"}.`);
    clear();
    router.refresh();
  }

  const columns = useMemo(() => {
    const cols = [
      {
        id: "name",
        header: "Mandant",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link href={`/clients/${row.original.id}`} className="font-medium text-foreground hover:text-primary truncate block max-w-48">
              {row.original.name}
            </Link>
            <span className="text-xs text-muted">{row.original.type}</span>
          </div>
        ),
      },
      { id: "company", header: "Unternehmen", accessorKey: "company" },
      { id: "responsible", header: "Zuständig", accessorKey: "responsible" },
      {
        id: "status",
        header: "Status",
        accessorKey: "processStatus",
        cell: ({ row }) => {
          const s = CLIENT_PROCESS_STATUS[row.original.processStatus] || { label: "–", tone: "gray" };
          return <Badge tone={s.tone}>{row.original.archived ? "Archiviert" : s.label}</Badge>;
        },
      },
      {
        id: "openTasks",
        header: "Aufgaben",
        accessorKey: "openTasks",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <span>{row.original.openTasks}</span>
            {row.original.overdueTasks > 0 ? <Badge tone="red">{row.original.overdueTasks} überfällig</Badge> : null}
          </span>
        ),
      },
      {
        id: "missing",
        header: "Fehlende Unterlagen",
        accessorKey: "missing",
        cell: ({ row }) =>
          row.original.missing > 0 ? (
            <Badge tone="amber">{row.original.missing}</Badge>
          ) : (
            <span className="text-muted">–</span>
          ),
      },
      {
        id: "nextDeadline",
        header: "Nächste Frist",
        accessorKey: "nextDeadline",
        cell: ({ row }) => {
          const due = row.original.nextDeadline ? formatDate(row.original.nextDeadline) : "–";
          const rel = row.original.nextDeadline ? relativeDue(row.original.nextDeadline) : null;
          return rel ? (
            <span className="flex flex-col">
              <span>{due}</span>
              <Badge tone={rel === "red" ? "red" : "amber"} className="w-fit mt-0.5">{rel === "red" ? "kritisch" : "bald"}</Badge>
            </span>
          ) : (
            <span className="text-muted">{due}</span>
          );
        },
      },
      {
        id: "lastActivity",
        header: "Letzte Aktivität",
        accessorKey: "lastActivity",
        cell: ({ row }) => <span className="text-xs text-muted">{formatDate(row.original.lastActivity)}</span>,
      },
    ];
    return cols;
  }, []);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <NativeSelect aria-label="Status filtern" value={currentFilter.status} onChange={(e) => setFilter("status", e.target.value)} className="w-40">
          <option value="ACTIVE">Aktive Mandanten</option>
          <option value="ARCHIVED">Archiviert</option>
          <option value="ALL">Alle</option>
        </NativeSelect>
        <NativeSelect aria-label="Zuständigkeit filtern" value={currentFilter.responsible} onChange={(e) => setFilter("responsible", e.target.value)} className="w-52">
          <option value="">Alle Zuständigen</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </NativeSelect>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Mandant, Unternehmen, Zuständigkeit…"
        csvFileName="mandanten.csv"
        enableSelection={canArchive}
        selectionActions={(selected, clear) => (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => archiveSelected(selected, clear)}
          >
            {selected.some((r) => r.original.archived) ? "Reaktivieren" : "Archivieren"} ({selected.length})
          </Button>
        )}
        emptyTitle="Keine Mandanten"
        emptyDescription="Legen Sie Ihren ersten Mandanten an, um die digitale Mandantenakte zu nutzen."
      />
    </div>
  );
}

function relativeDue(date) {
  const days = Math.ceil((new Date(date) - new Date()) / 864e5);
  if (days < 3) return "red";
  if (days <= 14) return "amber";
  return null;
}

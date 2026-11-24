"use client";

import { useState } from "react";
import { DataTable } from "@sellerhub/ui/data-table";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { useErrorLogs } from "./api";
import { errorColumns } from "./columns";
import { ErrorLogDialog } from "./log-details";

const defs: FilterDef[] = [
  { key: "range", field: "createdAtUtc", type: "date-range" },
  { key: "statusCode", type: "number-range", label: "Status" },
  { key: "search", type: "search", placeholder: "Search path/message…" },
];

export function ErrorLogsPage() {
  const list = useServerList({ defs });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading } = useErrorLogs(list.request);

  return (
    <div className="space-y-4">
      <Filters filters={list.filters} />
      <DataTable
        columns={errorColumns(setSelectedId)}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
      />
      <ErrorLogDialog id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

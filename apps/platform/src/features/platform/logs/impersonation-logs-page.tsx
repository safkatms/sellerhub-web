"use client";

import { DataTable } from "@sellerhub/ui/data-table";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { useImpersonationLogs } from "./api";
import { impersonationColumns } from "./columns";

const defs: FilterDef[] = [
  { key: "range", field: "startedAtUtc", type: "date-range" },
  { key: "search", type: "search", placeholder: "Search reason…" },
];

export function ImpersonationLogsPage() {
  const list = useServerList({ defs });
  const { data, isLoading } = useImpersonationLogs(list.request);

  return (
    <div className="space-y-4">
      <Filters filters={list.filters} />
      <DataTable
        columns={impersonationColumns()}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
      />
    </div>
  );
}

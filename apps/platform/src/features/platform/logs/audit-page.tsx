"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { DataTable } from "@sellerhub/ui/data-table";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { useAuditLogs, type AuditLog } from "./api";
import { auditColumns } from "./columns";
import { AuditLogDialog } from "./log-details";

const defs: FilterDef[] = [
  { key: "range", field: "createdAtUtc", type: "date-range" },
  {
    key: "actorType",
    type: "select",
    allLabel: "All actors",
    options: [
      { value: "1", label: "Shop user" },
      { value: "2", label: "Platform admin" },
      { value: "3", label: "System" },
    ],
    icon: UserCog,
  },
  { key: "search", type: "search", placeholder: "Search action…" },
];

export function AuditLogsPage() {
  const list = useServerList({ defs });
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const { data, isLoading } = useAuditLogs(list.request);

  return (
    <div className="space-y-4">
      <Filters filters={list.filters} />
      <DataTable
        columns={auditColumns(setSelected)}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
      />
      <AuditLogDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

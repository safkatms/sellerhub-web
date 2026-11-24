"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { DataTable } from "@sellerhub/ui/data-table";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { useLoginLogs, type LoginLog } from "./api";
import { loginColumns } from "./columns";
import { LoginLogDialog } from "./log-details";

const defs: FilterDef[] = [
  { key: "range", field: "createdAtUtc", type: "date-range" },
  {
    key: "isSuccess",
    type: "select",
    allLabel: "All results",
    options: [
      { value: "true", label: "Success" },
      { value: "false", label: "Failed" },
    ],
    icon: CircleCheck,
  },
  { key: "search", type: "search", placeholder: "Search email/phone…" },
];

export function LoginLogsPage() {
  const list = useServerList({ defs });
  const [selected, setSelected] = useState<LoginLog | null>(null);
  const { data, isLoading } = useLoginLogs(list.request);

  return (
    <div className="space-y-4">
      <Filters filters={list.filters} />
      <DataTable
        columns={loginColumns(setSelected)}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
      />
      <LoginLogDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

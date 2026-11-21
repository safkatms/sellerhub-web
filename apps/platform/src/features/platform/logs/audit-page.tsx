"use client";

import { useState } from "react";
import { Input } from "@sellerhub/ui/components/input";
import { DataTable } from "@sellerhub/ui/data-table";
import { useAuditLogs, type AuditLog } from "./api";
import { auditColumns } from "./columns";
import { AuditLogDialog } from "./log-details";

const pageSize = 20;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const { data, isLoading } = useAuditLogs({
    page,
    pageSize,
    search: search || undefined,
  });

  return (
    <div className="space-y-4">
      <Input
        className="max-w-xs"
        value={search}
        placeholder="Search action…"
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <DataTable
        columns={auditColumns(setSelected)}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        sorting={[]}
        onPageChange={setPage}
        onSortingChange={() => {}}
      />
      <AuditLogDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

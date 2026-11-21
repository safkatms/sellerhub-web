"use client";

import { useState } from "react";
import { Input } from "@sellerhub/ui/components/input";
import { DataTable } from "@sellerhub/ui/data-table";
import { useImpersonationLogs } from "./api";
import { impersonationColumns } from "./columns";

const pageSize = 20;

export function ImpersonationLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useImpersonationLogs({
    page,
    pageSize,
    search: search || undefined,
  });

  return (
    <div className="space-y-4">
      <Input
        className="max-w-xs"
        value={search}
        placeholder="Search reason…"
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <DataTable
        columns={impersonationColumns()}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        sorting={[]}
        onPageChange={setPage}
        onSortingChange={() => {}}
      />
    </div>
  );
}

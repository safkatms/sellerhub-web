"use client";

import { useState } from "react";
import { Input } from "@sellerhub/ui/components/input";
import { DataTable } from "@sellerhub/ui/data-table";
import { useErrorLogs } from "./api";
import { errorColumns } from "./columns";
import { ErrorLogDialog } from "./log-details";

const pageSize = 20;

export function ErrorLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading } = useErrorLogs({
    page,
    pageSize,
    search: search || undefined,
  });

  return (
    <div className="space-y-4">
      <Input
        className="max-w-xs"
        value={search}
        placeholder="Search path/message…"
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <DataTable
        columns={errorColumns(setSelectedId)}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        sorting={[]}
        onPageChange={setPage}
        onSortingChange={() => {}}
      />
      <ErrorLogDialog id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

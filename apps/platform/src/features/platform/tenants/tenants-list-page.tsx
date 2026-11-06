"use client";
import { useState } from "react";
import Link from "next/link";
import type { SortingState } from "@tanstack/react-table";
import { Input } from "@sellerhub/ui/components/input";
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import { useTenants } from "./api";
import { tenantColumns } from "./columns";

const pageSize = 20;

/** Server-side paged/sorted/searched list (unlike the other lists, which sort locally). */
export function TenantsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const { data, isLoading } = useTenants({
    page,
    pageSize,
    search: search || undefined,
    sortBy: sorting[0]?.id,
    desc: sorting[0]?.desc ?? false,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search shops…"
          className="max-w-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button nativeButton={false} render={<Link href="/platform/tenants/new" />}>
          New shop
        </Button>
      </div>
      <DataTable
        columns={tenantColumns}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        sorting={sorting}
        onPageChange={setPage}
        onSortingChange={(next) => {
          setSorting(next);
          setPage(1);
        }}
      />
    </div>
  );
}

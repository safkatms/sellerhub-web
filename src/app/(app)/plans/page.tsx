"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { usePlans } from "@/features/plans/api";
import { planColumns } from "@/features/plans/columns";

export default function PlansPage() {
  const { data, isLoading } = usePlans();
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const pageSize = 10;

  const sortedPlans = useMemo(() => {
    const items = [...(data ?? [])];
    const sort = sorting[0];
    if (!sort) return items;

    return items.sort((a, b) => {
      const left =
        sort.id === "code"
          ? a.code
          : sort.id === "monthlyPrice"
            ? (a.monthlyPrice ?? -1)
            : sort.id === "status"
              ? a.isActive
              : a.name;
      const right =
        sort.id === "code"
          ? b.code
          : sort.id === "monthlyPrice"
            ? (b.monthlyPrice ?? -1)
            : sort.id === "status"
              ? b.isActive
              : b.name;
      return (
        (typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right))) *
        (sort.desc ? -1 : 1)
      );
    });
  }, [data, sorting]);

  const planPage = sortedPlans.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button nativeButton={false} render={<Link href="/plans/new" />}>
          New plan
        </Button>
      </div>
      <DataTable
        columns={planColumns}
        data={planPage}
        loading={isLoading}
        total={sortedPlans.length}
        page={page}
        pageSize={pageSize}
        sorting={sorting}
        onPageChange={setPage}
        onSortingChange={(nextSorting) => {
          setSorting(nextSorting);
          setPage(1);
        }}
      />
    </div>
  );
}

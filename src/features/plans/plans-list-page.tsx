"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useLocalTable, type SortAccessors } from "@/hooks/use-local-table";
import { usePlans, type Plan } from "./api";
import { planColumns } from "./columns";

const sortBy: SortAccessors<Plan> = {
  code: (p) => p.code,
  name: (p) => p.name,
  monthlyPrice: (p) => p.monthlyPrice ?? -1,
  status: (p) => (p.isActive ? 1 : 0),
};

export function PlansListPage() {
  const { data, isLoading } = usePlans();
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "name", desc: false }],
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button nativeButton={false} render={<Link href="/plans/new" />}>
          New plan
        </Button>
      </div>
      <DataTable columns={planColumns} loading={isLoading} {...table} />
    </div>
  );
}

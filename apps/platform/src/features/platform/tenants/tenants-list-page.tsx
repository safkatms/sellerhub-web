"use client";
import { useMemo } from "react";
import Link from "next/link";
import { CircleCheck, Tag } from "lucide-react";
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { Perm, useCan } from "@/features/platform/roles/api";
import { useTags } from "@/features/platform/crm/api";
import { planStateLabel } from "@/lib/enums";
import { useTenants } from "./api";
import { tenantColumns } from "./columns";

const stateDef: FilterDef = {
  key: "planState",
  type: "select",
  allLabel: "All states",
  options: planStateLabel.map((label, value) => ({
    value: String(value),
    label,
  })),
  icon: CircleCheck,
};
const searchDef: FilterDef = {
  key: "search",
  type: "search",
  placeholder: "Search shops…",
};

export function TenantsListPage() {
  const can = useCan();
  const { data: tags } = useTags();

  const defs = useMemo<FilterDef[]>(
    () => [
      stateDef,
      ...(tags && tags.length > 0
        ? ([
            {
              key: "tagId",
              type: "select",
              allLabel: "All tags",
              options: tags.map((t) => ({
                value: String(t.id),
                label: `${t.name} (${t.tenantCount})`,
              })),
              icon: Tag,
            },
          ] satisfies FilterDef[])
        : []),
      searchDef,
    ],
    [tags],
  );

  const list = useServerList({
    defs,
    initialSort: [{ id: "createdAt", desc: true }],
  });
  const { data, isLoading } = useTenants(list.request);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <Filters filters={list.filters} className="flex-1" />
        {can(Perm.TenantManage) && (
          <Button
            nativeButton={false}
            render={<Link href="/platform/tenants/new" />}
          >
            New shop
          </Button>
        )}
      </div>
      <DataTable
        columns={tenantColumns}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import {
  useLocalTable,
  type SortAccessors,
} from "@sellerhub/ui/hooks/use-local-table";
import { Perm, useCan } from "@/features/platform/roles/api";
import { usePlans } from "@/features/platform/plans/api";
import { useCoupons, type Coupon } from "./api";
import { couponColumns } from "./columns";

const sortBy: SortAccessors<Coupon> = {
  code: (c) => c.code,
  discount: (c) => c.discountValue,
  plan: (c) => c.planId ?? -1,
  used: (c) => c.redeemedCount,
  status: (c) => (c.isActive ? 1 : 0),
};

export function CouponsListPage() {
  const can = useCan();
  const { data, isLoading } = useCoupons();
  const { data: plans } = usePlans();
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "code", desc: false }],
  });
  const planName = (id: number | null) =>
    id == null
      ? "Any plan"
      : (plans?.find((p) => p.id === id)?.name ?? `#${id}`);

  return (
    <div className="space-y-4">
      {can(Perm.BillingManage) && (
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={<Link href="/platform/billing/coupons/new" />}
          >
            New coupon
          </Button>
        </div>
      )}
      <DataTable
        columns={couponColumns(planName)}
        loading={isLoading}
        {...table}
      />
    </div>
  );
}

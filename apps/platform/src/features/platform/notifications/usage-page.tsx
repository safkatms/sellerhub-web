"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import { DataTable } from "@sellerhub/ui/data-table";
import {
  useLocalTable,
  type SortAccessors,
} from "@sellerhub/ui/hooks/use-local-table";
import { money } from "@/features/platform/billing/api";
import { useMessageUsage } from "./api";
import { usageColumns, type UsageRow } from "./columns";

const select = "h-9 rounded-md border bg-background px-2 text-sm";

const sortBy: SortAccessors<UsageRow> = {
  shop: (r) => r.tenantName ?? "",
  smsSent: (r) => r.smsSent,
  emailSent: (r) => r.emailSent,
  failed: (r) => r.failed,
  cost: (r) => r.cost,
};

export function UsagePage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useMessageUsage(days, true);
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "cost", desc: true }],
  });
  const total = (data ?? []).reduce((s, r) => s + r.cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          SMS and email per shop
          <select
            className={select}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[7, 30, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cost uses the provider&apos;s price, or the SmsCostPerMessage setting.
          Total {money(total)}.
        </p>
      </CardHeader>
      <CardContent>
        <DataTable columns={usageColumns} loading={isLoading} {...table} />
      </CardContent>
    </Card>
  );
}

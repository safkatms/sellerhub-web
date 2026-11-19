"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Input } from "@sellerhub/ui/components/input";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/access/api";
import { billingMonths, money, usePlanPrices, useSetPlanPrices } from "./api";

type Row = { enabled: boolean; price: string; isActive: boolean };

/** Price per billing period (1/3/6/12 months). The 1-month price also updates the plan's monthly price. */
export function PlanPricesCard({ planId }: { planId: number }) {
  const can = useCan();
  const { data, isLoading } = usePlanPrices(planId);
  const save = useSetPlanPrices(planId);
  const [rows, setRows] = useState<Record<number, Row>>({});

  useEffect(() => {
    if (!data) return;
    setRows(Object.fromEntries(billingMonths.map((m) => {
      const p = data.find((x) => x.months === m);
      return [m, { enabled: Boolean(p), price: p ? String(p.price) : "", isActive: p?.isActive ?? true }];
    })));
  }, [data]);

  if (isLoading) return <Spinner className="mx-auto mt-6 size-6" />;
  const editable = can(Perm.PlanManage);
  const monthly = Number(rows[1]?.price);
  const valid = billingMonths.every((m) => !rows[m]?.enabled || (rows[m].price.trim() !== "" && Number(rows[m].price) >= 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prices</CardTitle>
        <p className="text-sm text-muted-foreground">
          Longer periods can be cheaper. Shops can only buy the periods that are on and active.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {billingMonths.map((m) => {
          const r = rows[m] ?? { enabled: false, price: "", isActive: true };
          const perMonth = r.enabled && Number(r.price) > 0 ? Number(r.price) / m : null;
          const saving = perMonth != null && monthly > 0 && m > 1 ? Math.round((1 - perMonth / monthly) * 100) : null;
          return (
            <div key={m} className="flex flex-wrap items-center gap-3">
              <label className="flex w-32 items-center gap-2 text-sm">
                <Checkbox checked={r.enabled} disabled={!editable}
                  onCheckedChange={(c) => setRows((x) => ({ ...x, [m]: { ...r, enabled: c === true } }))} />
                {m} month{m > 1 ? "s" : ""}
              </label>
              <Input className="w-36" type="number" min={0} step="0.01" disabled={!editable || !r.enabled} placeholder="Price (৳)"
                value={r.price} onChange={(e) => setRows((x) => ({ ...x, [m]: { ...r, price: e.target.value } }))} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={r.isActive} disabled={!editable || !r.enabled}
                  onCheckedChange={(c) => setRows((x) => ({ ...x, [m]: { ...r, isActive: c === true } }))} />
                Sellable
              </label>
              {perMonth != null && m > 1 && (
                <span className="text-xs text-muted-foreground">
                  {money(perMonth)}/mo{saving != null && saving > 0 ? ` · ${saving}% off` : ""}
                </span>
              )}
            </div>
          );
        })}
        {editable && (
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate(
            billingMonths.filter((m) => rows[m]?.enabled).map((m) => ({ months: m, price: Number(rows[m].price), currency: "BDT", isActive: rows[m].isActive })),
            { onSuccess: () => toast.success("Prices saved"), onError: (e) => applyProblem(e) },
          )}>
            Save prices
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

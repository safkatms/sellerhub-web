"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import { Input } from "@sellerhub/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sellerhub/ui/components/table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/roles/api";
import { usePlans } from "@/features/platform/plans/api";
import { InvoiceTable } from "./invoice-table";
import {
  billingMonths,
  money,
  useCredits,
  useGrantCredit,
  useInvoiceMutations,
  useQuote,
  type Quote,
} from "./api";

const select = "h-9 rounded-md border bg-background px-2 text-sm";

/** Shop page: invoices for this shop, issue an invoice, grant extra days. */
export function TenantBillingCards({
  tenantId,
  readOnly,
}: {
  tenantId: string;
  readOnly: boolean;
}) {
  const can = useCan();
  const { data: plans } = usePlans();
  const quote = useQuote();
  const invoices = useInvoiceMutations();
  const { data: credits } = useCredits(tenantId);
  const grant = useGrantCredit(tenantId);
  const [planId, setPlanId] = useState<number>();
  const [months, setMonths] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [preview, setPreview] = useState<Quote | null>(null);
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const editable = !readOnly && can(Perm.BillingManage);

  return (
    <div className="space-y-4">
      {editable && (
        <Card>
          <CardHeader>
            <CardTitle>Issue an invoice</CardTitle>
            <p className="text-sm text-muted-foreground">
              An unpaid bill. Marking it paid later extends the plan.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <select
                className={select}
                value={planId ?? ""}
                onChange={(e) => {
                  setPlanId(Number(e.target.value) || undefined);
                  setPreview(null);
                }}
              >
                <option value="">Plan…</option>
                {plans
                  ?.filter((p) => p.isActive)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <select
                className={select}
                value={months}
                onChange={(e) => {
                  setMonths(Number(e.target.value));
                  setPreview(null);
                }}
              >
                {billingMonths.map((m) => (
                  <option key={m} value={m}>
                    {m} month{m > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <Input
                className="w-40"
                placeholder="Coupon (optional)"
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value.toUpperCase());
                  setPreview(null);
                }}
              />
              <Button
                variant="outline"
                disabled={!planId || quote.isPending}
                onClick={() =>
                  planId &&
                  quote.mutate(
                    {
                      tenantId,
                      body: { planId, months, couponCode: coupon || undefined },
                    },
                    { onSuccess: setPreview, onError: (e) => applyProblem(e) },
                  )
                }
              >
                Price
              </Button>
              <Button
                disabled={!planId || invoices.create.isPending}
                onClick={() =>
                  planId &&
                  invoices.create.mutate(
                    {
                      tenantId,
                      body: { planId, months, couponCode: coupon || undefined },
                    },
                    {
                      onSuccess: (i) => {
                        toast.success(`Invoice ${i.number} issued`);
                        setPreview(null);
                        setCoupon("");
                      },
                      onError: (e) => applyProblem(e),
                    },
                  )
                }
              >
                Issue invoice
              </Button>
            </div>
            {preview && (
              <p className="text-sm">
                {preview.planName}, {preview.months} month(s):{" "}
                {money(preview.subtotal, preview.currency)}
                {preview.discount > 0 && (
                  <> − {money(preview.discount, preview.currency)}</>
                )}{" "}
                = <b>{money(preview.total, preview.currency)}</b>
                {preview.couponError && (
                  <span className="ml-2 text-destructive">
                    {preview.couponError}
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceTable tenantId={tenantId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extra days</CardTitle>
          <p className="text-sm text-muted-foreground">
            Goodwill or compensation: moves the expiry forward without a
            payment.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {editable && (
            <div className="flex flex-wrap gap-2">
              <Input
                className="w-24"
                type="number"
                min={1}
                max={366}
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
              <Input
                className="w-80"
                maxLength={500}
                placeholder="Reason (required)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                disabled={
                  !reason.trim() || !(Number(days) >= 1) || grant.isPending
                }
                onClick={() =>
                  grant.mutate(
                    { days: Number(days), reason: reason.trim() },
                    {
                      onSuccess: (c) => {
                        toast.success(
                          `New expiry ${fmtDate(c.newExpiresAtUtc)}`,
                        );
                        setReason("");
                      },
                      onError: (e) => applyProblem(e),
                    },
                  )
                }
              >
                Grant
              </Button>
            </div>
          )}
          {credits && credits.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{fmtDate(c.createdAtUtc)}</TableCell>
                    <TableCell>+{c.days}</TableCell>
                    <TableCell className="text-xs">
                      {fmtDate(c.previousExpiresAtUtc)} →{" "}
                      {fmtDate(c.newExpiresAtUtc)}
                    </TableCell>
                    <TableCell>{c.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import { money, useBillingSummary } from "./api";

export function BillingSummary() {
  const { data: s } = useBillingSummary();
  const items = [
    ["Payments to review", s?.pendingPaymentRequests ?? "-"],
    ["Unpaid invoices", s?.unpaidInvoices ?? "-"],
    ["Paid this month (UTC)", money(s?.paidThisMonth)],
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{value}</CardContent>
        </Card>
      ))}
    </div>
  );
}

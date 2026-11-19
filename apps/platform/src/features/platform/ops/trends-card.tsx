"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sellerhub/ui/components/table";
import { money } from "@/features/platform/billing/api";
import { useTrends } from "./api";

const select = "h-9 rounded-md border bg-background px-2 text-sm font-normal";

/** Daily snapshots written by the daily-stats job. Empty until the job has run at least once. */
export function TrendsCard() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useTrends(days);
  const rows = [...(data ?? [])].reverse();
  const first = data?.[0];
  const last = data?.[data.length - 1];
  const delta = (a?: number, b?: number) => (a == null || b == null ? null : b - a);
  const mrrDelta = delta(first?.mrr, last?.mrr);
  const activeDelta = delta(first?.activeShops, last?.activeShops);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Trends
          <select className={select} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 30, 90, 365].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </CardTitle>
        {last && (
          <p className="text-sm text-muted-foreground">
            MRR {money(last.mrr)}{mrrDelta != null && mrrDelta !== 0 ? ` (${mrrDelta > 0 ? "+" : ""}${money(mrrDelta)})` : ""} ·
            {" "}active shops {last.activeShops}{activeDelta != null && activeDelta !== 0 ? ` (${activeDelta > 0 ? "+" : ""}${activeDelta})` : ""}
            {" "}over the period.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? <Spinner className="mx-auto size-6" /> : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No snapshots yet. The daily-stats job writes one per day (Ops → Background jobs).</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Active</TableHead><TableHead>Grace</TableHead><TableHead>Expired</TableHead>
                <TableHead>New</TableHead><TableHead>Users</TableHead><TableHead>SMS</TableHead><TableHead>MRR</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.date}>
                    <TableCell className="text-xs">{p.date}</TableCell>
                    <TableCell>{p.activeShops}</TableCell><TableCell>{p.graceShops}</TableCell><TableCell>{p.expiredShops}</TableCell>
                    <TableCell>{p.newShops}</TableCell><TableCell>{p.totalUsers}</TableCell><TableCell>{p.smsSent}</TableCell>
                    <TableCell>{money(p.mrr)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sellerhub/ui/components/table";
import { applyProblem, getProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import {
  PaymentMethod, invoiceStatusLabel, money, paymentMethodLabel, paymentStatusLabel,
  useBillingOverview, useInvoices, usePaymentMutations, usePaymentRequests, useQuote, type Quote,
} from "./api";

const select = "h-9 w-full rounded-md border bg-background px-2 text-sm";

/** Owner-only: current plan, how to pay by bKash/Nagad, submit the transaction id, history. */
export function BillingPage() {
  const { data: overview, isLoading, error } = useBillingOverview();
  const { data: requests } = usePaymentRequests();
  const { data: invoices } = useInvoices();
  const quote = useQuote();
  const pay = usePaymentMutations();
  const [planId, setPlanId] = useState<number>();
  const [months, setMonths] = useState<number>();
  const [coupon, setCoupon] = useState("");
  const [price, setPrice] = useState<Quote | null>(null);
  const [method, setMethod] = useState<number>(PaymentMethod.BKash);
  const [trx, setTrx] = useState("");
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  if (isLoading) return <Spinner className="mx-auto mt-12 size-8" />;
  if (getProblem(error)?.status === 403) return <p className="text-muted-foreground">Only the shop owner can see billing.</p>;
  if (!overview) return null;

  const plan = overview.plans.find((p) => p.planId === planId);
  const refreshQuote = (pId = planId, m = months, c = coupon) => {
    setPrice(null);
    if (!pId || !m) return;
    quote.mutate({ planId: pId, months: m, couponCode: c || undefined }, {
      onSuccess: (q) => { setPrice(q); setAmount(String(q.total)); },
      onError: (e) => applyProblem(e),
    });
  };

  return (
    <div className="max-w-4xl space-y-4">
      <Card>
        <CardHeader><CardTitle>Your plan</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-lg font-semibold">{overview.planName}</span>
          <Badge variant={overview.planState === "Active" ? "default" : "destructive"}>{overview.planState}</Badge>
          <span className="text-muted-foreground">
            {overview.planExpiresAtUtc ? `Valid until ${fmtDate(overview.planExpiresAtUtc)}` : "Never expires"}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Renew or upgrade</CardTitle>
          {overview.paymentInstructions && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{overview.paymentInstructions}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5"><Label>Plan</Label>
              <select className={select} value={planId ?? ""} onChange={(e) => {
                const id = Number(e.target.value) || undefined;
                const m = overview.plans.find((p) => p.planId === id)?.prices[0]?.months;
                setPlanId(id); setMonths(m); refreshQuote(id, m);
              }}>
                <option value="">Choose…</option>
                {overview.plans.map((p) => <option key={p.planId} value={p.planId}>{p.name}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label>Period</Label>
              <select className={select} value={months ?? ""} disabled={!plan} onChange={(e) => { const m = Number(e.target.value); setMonths(m); refreshQuote(planId, m); }}>
                {plan?.prices.map((p) => <option key={p.months} value={p.months}>{p.months} month{p.months > 1 ? "s" : ""}: {money(p.price, p.currency)}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label>Coupon (optional)</Label>
              <div className="flex gap-2">
                <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
                <Button variant="outline" disabled={!plan || quote.isPending} onClick={() => refreshQuote()}>Apply</Button>
              </div></div>
          </div>
          {plan?.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
          {price && (
            <div className="rounded-md border p-3 text-sm">
              {money(price.subtotal, price.currency)}
              {price.discount > 0 && <> − {money(price.discount, price.currency)} ({price.couponCode})</>}
              {" "}= <b className="text-base">{money(price.total, price.currency)}</b>
              {price.couponError && <div className="text-destructive">{price.couponError}</div>}
            </div>
          )}

          {price && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Paid with</Label>
                <select className={select} value={method} onChange={(e) => setMethod(Number(e.target.value))}>
                  {Object.entries(paymentMethodLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select></div>
              <div className="space-y-1.5"><Label>Transaction ID (TrxID)</Label>
                <Input maxLength={100} value={trx} onChange={(e) => setTrx(e.target.value.trim())} placeholder="e.g. 9A7B6C5D4E" /></div>
              <div className="space-y-1.5"><Label>Paid from number / account (optional)</Label>
                <Input maxLength={50} value={payer} onChange={(e) => setPayer(e.target.value)} placeholder="01XXXXXXXXX" /></div>
              <div className="space-y-1.5"><Label>Amount you paid</Label>
                <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Note (optional)</Label>
                <Input maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></div>
              <div className="sm:col-span-2">
                <Button disabled={!trx || !(Number(amount) > 0) || pay.submit.isPending || Boolean(price.couponError)} onClick={() => planId && months && pay.submit.mutate(
                  { planId, months, amount: Number(amount), method, transactionId: trx, payerAccount: payer.trim() || undefined,
                    couponCode: price.couponCode ?? undefined, note: note.trim() || undefined },
                  { onSuccess: () => { toast.success("Submitted. We will verify it shortly."); setTrx(""); setPayer(""); setNote(""); }, onError: (e) => applyProblem(e) },
                )}>Submit payment</Button>
                <p className="mt-2 text-xs text-muted-foreground">Your plan is extended as soon as we confirm the payment.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Submitted payments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Plan</TableHead><TableHead>Paid</TableHead><TableHead>TrxID</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {requests?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{fmtDate(r.createdAtUtc)}</TableCell>
                  <TableCell>{r.planName} · {r.months} mo</TableCell>
                  <TableCell>{money(r.amount, r.currency)} <span className="text-xs text-muted-foreground">{paymentMethodLabel[r.method]}</span></TableCell>
                  <TableCell><code className="text-xs">{r.transactionId}</code></TableCell>
                  <TableCell>
                    <Badge variant={r.status === 2 ? "default" : r.status === 3 ? "destructive" : "secondary"}>{paymentStatusLabel[r.status]}</Badge>
                    {r.reviewNote && <div className="text-xs text-muted-foreground">{r.reviewNote}</div>}
                    {r.invoiceNumber && <div className="text-xs text-muted-foreground">Invoice {r.invoiceNumber}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 1 && <Button size="sm" variant="ghost" onClick={() => pay.cancel.mutate(r.id, { onError: (e) => applyProblem(e) })}>Cancel</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {requests?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No payments yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Plan</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoices?.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.number}</TableCell>
                  <TableCell>{i.planName} · {i.months} mo</TableCell>
                  <TableCell>{money(i.total, i.currency)}{i.discount > 0 && <div className="text-xs text-muted-foreground">−{money(i.discount, i.currency)}</div>}</TableCell>
                  <TableCell><Badge variant={i.status === 2 ? "default" : "secondary"}>{invoiceStatusLabel[i.status]}</Badge>
                    {i.status === 1 && i.dueAtUtc && <div className="text-xs text-muted-foreground">Due {fmtDate(i.dueAtUtc)}</div>}</TableCell>
                  <TableCell className="text-xs">{fmtDate(i.paidAtUtc ?? i.issuedAtUtc)}</TableCell>
                </TableRow>
              ))}
              {invoices?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No invoices yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

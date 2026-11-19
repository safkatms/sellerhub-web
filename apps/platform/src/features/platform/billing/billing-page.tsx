"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sellerhub/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sellerhub/ui/components/tabs";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/access/api";
import { usePlans } from "@/features/platform/plans/api";
import { Pager } from "@/components/pager";
import {
  CouponDiscountType, InvoiceStatus, PaymentRequestStatus, invoiceStatusLabel, money, paymentMethodLabel, paymentStatusLabel,
  useBillingSummary, useCouponMutations, useCoupons, useInvoiceMutations, useInvoices, usePaymentRequests, useReviewPayment,
  type Coupon, type Invoice, type PaymentRequestItem,
} from "./api";

const pageSize = 20;
const select = "h-9 rounded-md border bg-background px-2 text-sm";

export function BillingPage() {
  const { data: summary } = useBillingSummary();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Payments to review</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{summary?.pendingPaymentRequests ?? "-"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Unpaid invoices</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{summary?.unpaidInvoices ?? "-"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Paid this month (UTC)</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{money(summary?.paidThisMonth)}</CardContent></Card>
      </div>
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList variant="line">
          <TabsTrigger value="requests">Payment requests</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>
        <TabsContent value="requests"><PaymentRequestsTab /></TabsContent>
        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        <TabsContent value="coupons"><CouponsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------- payment requests

function PaymentRequestsTab() {
  const can = useCan();
  const [status, setStatus] = useState<number | undefined>(PaymentRequestStatus.Pending);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = usePaymentRequests({ page, pageSize, status, search: search || undefined });
  const review = useReviewPayment();
  const [dialog, setDialog] = useState<{ item: PaymentRequestItem; approve: boolean } | null>(null);
  const [note, setNote] = useState("");

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap gap-2">
          <select className={select} value={status ?? ""} onChange={(e) => { setStatus(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}>
            <option value="">All statuses</option>
            {Object.entries(paymentStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input className="max-w-xs" placeholder="Search trx id, shop, payer…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {isLoading ? <Spinner className="mx-auto size-6" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Submitted</TableHead><TableHead>Shop</TableHead><TableHead>Plan</TableHead><TableHead>Paid</TableHead>
              <TableHead>Method / Trx</TableHead><TableHead>Status</TableHead><TableHead className="text-right" />
            </TableRow></TableHeader>
            <TableBody>
              {data?.items.map((r) => {
                const short = r.expectedTotal != null && r.amount < r.expectedTotal;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{fmtDate(r.createdAtUtc)}</TableCell>
                    <TableCell><Link className="underline" href={`/platform/tenants/${r.tenantId}`}>{r.tenantName}</Link></TableCell>
                    <TableCell>{r.planName} · {r.months} mo{r.couponCode && <div className="text-xs text-muted-foreground">Coupon {r.couponCode}</div>}</TableCell>
                    <TableCell>
                      <div className={short ? "font-medium text-destructive" : "font-medium"}>{money(r.amount, r.currency)}</div>
                      {r.expectedTotal != null && <div className="text-xs text-muted-foreground">Expected {money(r.expectedTotal, r.currency)}</div>}
                    </TableCell>
                    <TableCell>
                      <div>{paymentMethodLabel[r.method]} <code className="text-xs select-all">{r.transactionId}</code></div>
                      {r.payerAccount && <div className="text-xs text-muted-foreground">From {r.payerAccount}</div>}
                      {r.note && <div className="max-w-56 truncate text-xs text-muted-foreground" title={r.note}>“{r.note}”</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === PaymentRequestStatus.Pending ? "secondary" : r.status === PaymentRequestStatus.Approved ? "default" : "outline"}>
                        {paymentStatusLabel[r.status]}
                      </Badge>
                      {r.invoiceNumber && <div className="text-xs text-muted-foreground">{r.invoiceNumber}</div>}
                      {r.reviewNote && <div className="max-w-48 truncate text-xs text-muted-foreground" title={r.reviewNote}>{r.reviewNote}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === PaymentRequestStatus.Pending && can(Perm.BillingManage) && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => { setNote(""); setDialog({ item: r, approve: true }); }}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => { setNote(""); setDialog({ item: r, approve: false }); }}>Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nothing here.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
        <Pager page={page} pageSize={pageSize} total={data?.totalCount ?? 0} onPage={setPage} />
      </CardContent>

      <Dialog open={Boolean(dialog)} onOpenChange={(o) => { if (!o) setDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.approve ? "Approve payment" : "Reject payment"}</DialogTitle>
            <DialogDescription>
              {dialog && (dialog.approve
                ? `Check ${paymentMethodLabel[dialog.item.method]} for transaction ${dialog.item.transactionId} of ${money(dialog.item.amount)} first. Approving creates a paid invoice and extends ${dialog.item.tenantName}'s ${dialog.item.planName} plan by ${dialog.item.months} month(s).`
                : "The shop sees this reason and can submit again.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="review-note">{dialog?.approve ? "Note (optional)" : "Reason"}</Label>
            <Input id="review-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant={dialog?.approve ? "default" : "destructive"} disabled={review.isPending || (!dialog?.approve && !note.trim())}
              onClick={() => dialog && review.mutate(
                { id: dialog.item.id, approve: dialog.approve, note: note.trim() || undefined, rowVersion: dialog.item.rowVersion },
                { onSuccess: () => { toast.success(dialog.approve ? "Approved: plan extended" : "Rejected"); setDialog(null); }, onError: (e) => applyProblem(e) },
              )}>
              {dialog?.approve ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------- invoices

export function InvoiceTable({ tenantId }: { tenantId?: string }) {
  const can = useCan();
  const [status, setStatus] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useInvoices({ page, pageSize, status, tenantId, search: search || undefined });
  const m = useInvoiceMutations();
  const [dialog, setDialog] = useState<{ invoice: Invoice; kind: "paid" | "void" } | null>(null);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className={select} value={status ?? ""} onChange={(e) => { setStatus(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}>
          <option value="">All statuses</option>
          {Object.entries(invoiceStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {!tenantId && <Input className="max-w-xs" placeholder="Search number, shop, reference…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />}
      </div>
      {isLoading ? <Spinner className="mx-auto size-6" /> : (
        <Table>
          <TableHeader><TableRow>
            <TableHead>Number</TableHead>{!tenantId && <TableHead>Shop</TableHead>}<TableHead>Plan</TableHead>
            <TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Issued</TableHead><TableHead className="text-right" />
          </TableRow></TableHeader>
          <TableBody>
            {data?.items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.number}</TableCell>
                {!tenantId && <TableCell><Link className="underline" href={`/platform/tenants/${i.tenantId}`}>{i.tenantName}</Link></TableCell>}
                <TableCell>{i.planName} · {i.months} mo</TableCell>
                <TableCell>
                  {money(i.total, i.currency)}
                  {i.discount > 0 && <div className="text-xs text-muted-foreground">−{money(i.discount, i.currency)} discount</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={i.status === InvoiceStatus.Paid ? "default" : i.status === InvoiceStatus.Unpaid ? "secondary" : "outline"}>
                    {invoiceStatusLabel[i.status]}
                  </Badge>
                  {i.paymentReference && <div className="text-xs text-muted-foreground">{i.paymentReference}</div>}
                  {i.voidReason && <div className="text-xs text-muted-foreground">{i.voidReason}</div>}
                </TableCell>
                <TableCell>
                  {fmtDate(i.issuedAtUtc)}
                  {i.status === InvoiceStatus.Unpaid && i.dueAtUtc && <div className="text-xs text-muted-foreground">Due {fmtDate(i.dueAtUtc)}</div>}
                  {i.paidAtUtc && <div className="text-xs text-muted-foreground">Paid {fmtDate(i.paidAtUtc)}</div>}
                </TableCell>
                <TableCell className="text-right">
                  {i.status === InvoiceStatus.Unpaid && can(Perm.BillingManage) && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => { setText(""); setNotes(""); setDialog({ invoice: i, kind: "paid" }); }}>Mark paid</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setText(""); setDialog({ invoice: i, kind: "void" }); }}>Void</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {data?.items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No invoices.</TableCell></TableRow>}
          </TableBody>
        </Table>
      )}
      <Pager page={page} pageSize={pageSize} total={data?.totalCount ?? 0} onPage={setPage} />

      <Dialog open={Boolean(dialog)} onOpenChange={(o) => { if (!o) setDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.kind === "paid" ? `Mark ${dialog.invoice.number} paid` : `Void ${dialog?.invoice.number}`}</DialogTitle>
            <DialogDescription>
              {dialog?.kind === "paid"
                ? `Extends the plan by ${dialog.invoice.months} month(s) and records ${money(dialog.invoice.total, dialog.invoice.currency)}.`
                : "A void invoice cannot be paid. The shop does not see it anymore."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-text">{dialog?.kind === "paid" ? "Payment reference (bKash/Nagad trx id)" : "Reason"}</Label>
              <Input id="inv-text" maxLength={dialog?.kind === "paid" ? 100 : 500} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            {dialog?.kind === "paid" && (
              <div className="space-y-1.5">
                <Label htmlFor="inv-notes">Notes (optional)</Label>
                <Input id="inv-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant={dialog?.kind === "void" ? "destructive" : "default"}
              disabled={m.markPaid.isPending || m.void.isPending || (dialog?.kind === "void" && !text.trim())}
              onClick={() => {
                if (!dialog) return;
                const done = { onSuccess: () => { toast.success("Saved"); setDialog(null); }, onError: (e: unknown) => applyProblem(e) };
                if (dialog.kind === "paid")
                  m.markPaid.mutate({ id: dialog.invoice.id, body: { paymentReference: text.trim() || undefined, notes: notes.trim() || undefined, rowVersion: dialog.invoice.rowVersion } }, done);
                else m.void.mutate({ id: dialog.invoice.id, body: { reason: text.trim(), rowVersion: dialog.invoice.rowVersion } }, done);
              }}>
              {dialog?.kind === "paid" ? "Mark paid" : "Void"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoicesTab() {
  return <Card><CardContent className="pt-6"><InvoiceTable /></CardContent></Card>;
}

// ---------------------------------------------------------------- coupons

type CouponForm = {
  code: string; description: string; discountType: number; discountValue: string; maxRedemptions: string; maxPerTenant: string;
  planId: string; validFrom: string; validTo: string; isActive: boolean;
};
const emptyCoupon: CouponForm = { code: "", description: "", discountType: CouponDiscountType.Percent, discountValue: "", maxRedemptions: "",
  maxPerTenant: "1", planId: "", validFrom: "", validTo: "", isActive: true };
const optInt = (s: string) => (s.trim() === "" ? null : Number(s));
const dateToUtc = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toISOString() : null);

function CouponsTab() {
  const can = useCan();
  const { data: coupons, isLoading } = useCoupons();
  const { data: plans } = usePlans();
  const m = useCouponMutations();
  const [editing, setEditing] = useState<{ coupon: Coupon | null } | null>(null);
  const [f, setF] = useState<CouponForm>(emptyCoupon);
  const set = <K extends keyof CouponForm>(k: K, v: CouponForm[K]) => setF((x) => ({ ...x, [k]: v }));

  const open = (c: Coupon | null) => {
    setF(c ? {
      code: c.code, description: c.description ?? "", discountType: c.discountType, discountValue: String(c.discountValue),
      maxRedemptions: c.maxRedemptions?.toString() ?? "", maxPerTenant: c.maxPerTenant?.toString() ?? "",
      planId: c.planId?.toString() ?? "", validFrom: c.validFromUtc?.slice(0, 10) ?? "", validTo: c.validToUtc?.slice(0, 10) ?? "",
      isActive: c.isActive,
    } : emptyCoupon);
    setEditing({ coupon: c });
  };
  const planName = (id: number | null) => (id == null ? "Any plan" : plans?.find((p) => p.id === id)?.name ?? `#${id}`);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {can(Perm.BillingManage) && <Button onClick={() => open(null)}>New coupon</Button>}
        {isLoading ? <Spinner className="mx-auto size-6" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Plan</TableHead><TableHead>Used</TableHead>
              <TableHead>Valid</TableHead><TableHead>Status</TableHead><TableHead className="text-right" />
            </TableRow></TableHeader>
            <TableBody>
              {coupons?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><code>{c.code}</code>{c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}</TableCell>
                  <TableCell>{c.discountType === CouponDiscountType.Percent ? `${c.discountValue}%` : money(c.discountValue)}</TableCell>
                  <TableCell>{planName(c.planId)}</TableCell>
                  <TableCell>{c.redeemedCount}{c.maxRedemptions != null && ` / ${c.maxRedemptions}`}
                    {c.maxPerTenant != null && <div className="text-xs text-muted-foreground">{c.maxPerTenant} per shop</div>}</TableCell>
                  <TableCell className="text-xs">{c.validFromUtc ? fmtDate(c.validFromUtc) : "Now"} → {c.validToUtc ? fmtDate(c.validToUtc) : "No end"}</TableCell>
                  <TableCell><Badge variant={c.isActive ? "default" : "outline"}>{c.isActive ? "Active" : "Off"}</Badge></TableCell>
                  <TableCell className="text-right">
                    {can(Perm.BillingManage) && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => open(c)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => confirm(`Delete coupon ${c.code}?`) &&
                          m.remove.mutate(c.id, { onSuccess: () => toast.success("Deleted"), onError: (e) => applyProblem(e) })}>Delete</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {coupons?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No coupons.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.coupon ? `Edit ${editing.coupon.code}` : "New coupon"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Code</Label>
              <Input maxLength={50} value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="EID20" /></div>
            <div className="space-y-1.5"><Label>Plan</Label>
              <select className={`${select} w-full`} value={f.planId} onChange={(e) => set("planId", e.target.value)}>
                <option value="">Any plan</option>
                {plans?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label>Type</Label>
              <select className={`${select} w-full`} value={f.discountType} onChange={(e) => set("discountType", Number(e.target.value))}>
                <option value={CouponDiscountType.Percent}>Percent</option>
                <option value={CouponDiscountType.Fixed}>Fixed amount (৳)</option>
              </select></div>
            <div className="space-y-1.5"><Label>{f.discountType === CouponDiscountType.Percent ? "Percent off" : "Amount off"}</Label>
              <Input type="number" min={0} step="0.01" value={f.discountValue} onChange={(e) => set("discountValue", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Max uses (blank = unlimited)</Label>
              <Input type="number" min={1} value={f.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Max per shop (blank = unlimited)</Label>
              <Input type="number" min={1} value={f.maxPerTenant} onChange={(e) => set("maxPerTenant", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Valid from (UTC date)</Label>
              <Input type="date" value={f.validFrom} onChange={(e) => set("validFrom", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Valid until (UTC date)</Label>
              <Input type="date" value={f.validTo} onChange={(e) => set("validTo", e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label>
              <Input maxLength={500} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.isActive} onCheckedChange={(c) => set("isActive", c === true)} /> Active</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={m.save.isPending || !f.code.trim() || !(Number(f.discountValue) > 0)} onClick={() => m.save.mutate(
              { id: editing?.coupon?.id, body: {
                code: f.code.trim(), description: f.description.trim() || null, discountType: f.discountType,
                discountValue: Number(f.discountValue), maxRedemptions: optInt(f.maxRedemptions), maxPerTenant: optInt(f.maxPerTenant),
                planId: optInt(f.planId), validFromUtc: dateToUtc(f.validFrom), validToUtc: dateToUtc(f.validTo), isActive: f.isActive,
                rowVersion: editing?.coupon?.rowVersion ?? null } },
              { onSuccess: () => { toast.success("Coupon saved"); setEditing(null); }, onError: (e) => applyProblem(e) },
            )}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

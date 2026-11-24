"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { DataTable } from "@sellerhub/ui/data-table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import {
  DateRange,
  InvoiceQuery,
  invoiceStatusLabel,
  money,
  useInvoiceMutations,
  useInvoices,
  type Invoice,
} from "./api";
import { invoiceColumns } from "./columns";

const pageSize = 20;
const select = "h-9 rounded-md border bg-background px-2 text-sm";

export function InvoiceTable({
  tenantId,
  params,
  resetKey,
}: {
  tenantId?: string;
  params?: Record<string, unknown>;
  resetKey?: string;
}) {
  const can = useCan();
  const [status, setStatus] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useInvoices({
    page,
    pageSize,
    tenantId,
    ...params,
    status: params?.status ? Number(params.status) : undefined,
  } as InvoiceQuery);

  useEffect(() => setPage(1), [resetKey]);

  const m = useInvoiceMutations();
  const [dialog, setDialog] = useState<{
    invoice: Invoice;
    kind: "paid" | "void";
  } | null>(null);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");

  const columns = invoiceColumns(!tenantId, can(Perm.BillingManage), {
    onPaid: (invoice) => {
      setText("");
      setNotes("");
      setDialog({ invoice, kind: "paid" });
    },
    onVoid: (invoice) => {
      setText("");
      setDialog({ invoice, kind: "void" });
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          className={select}
          value={status ?? ""}
          onChange={(e) => {
            setStatus(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {Object.entries(invoiceStatusLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {!tenantId && (
          <Input
            className="max-w-xs"
            placeholder="Search number, shop, reference…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        sorting={[]}
        onPageChange={setPage}
        onSortingChange={() => {}}
      />

      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "paid"
                ? `Mark ${dialog.invoice.number} paid`
                : `Void ${dialog?.invoice.number}`}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === "paid"
                ? `Extends the plan by ${dialog.invoice.months} month(s) and records ${money(dialog.invoice.total, dialog.invoice.currency)}.`
                : "A void invoice cannot be paid. The shop does not see it anymore."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-text">
                {dialog?.kind === "paid"
                  ? "Payment reference (bKash/Nagad trx id)"
                  : "Reason"}
              </Label>
              <Input
                id="inv-text"
                maxLength={dialog?.kind === "paid" ? 100 : 500}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            {dialog?.kind === "paid" && (
              <div className="space-y-1.5">
                <Label htmlFor="inv-notes">Notes (optional)</Label>
                <Input
                  id="inv-notes"
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={dialog?.kind === "void" ? "destructive" : "default"}
              disabled={
                m.markPaid.isPending ||
                m.void.isPending ||
                (dialog?.kind === "void" && !text.trim())
              }
              onClick={() => {
                if (!dialog) return;
                const done = {
                  onSuccess: () => {
                    toast.success("Saved");
                    setDialog(null);
                  },
                  onError: (e: unknown) => applyProblem(e),
                };
                if (dialog.kind === "paid")
                  m.markPaid.mutate(
                    {
                      id: dialog.invoice.id,
                      body: {
                        paymentReference: text.trim() || undefined,
                        notes: notes.trim() || undefined,
                        rowVersion: dialog.invoice.rowVersion,
                      },
                    },
                    done,
                  );
                else
                  m.void.mutate(
                    {
                      id: dialog.invoice.id,
                      body: {
                        reason: text.trim(),
                        rowVersion: dialog.invoice.rowVersion,
                      },
                    },
                    done,
                  );
              }}
            >
              {dialog?.kind === "paid" ? "Mark paid" : "Void"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
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
import type { ServerList } from "@sellerhub/ui/hooks/use-server-list";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import { money, useInvoiceMutations, useInvoices, type Invoice } from "./api";
import { invoiceColumns } from "./columns";

/** `list` comes from useServerList; a shop's own tab passes a fixed tenantId filter and `oneShop`. */
export function InvoiceTable({
  list,
  oneShop = false,
}: {
  list: ServerList;
  oneShop?: boolean;
}) {
  const can = useCan();
  const { data, isLoading } = useInvoices(list.request);

  const m = useInvoiceMutations();
  const [dialog, setDialog] = useState<{
    invoice: Invoice;
    kind: "paid" | "void";
  } | null>(null);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");

  const columns = invoiceColumns(!oneShop, can(Perm.BillingManage), {
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
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
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

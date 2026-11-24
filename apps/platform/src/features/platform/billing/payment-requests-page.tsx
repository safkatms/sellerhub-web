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
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import {
  PaymentRequestStatus,
  money,
  paymentMethodLabel,
  paymentStatusLabel,
  usePaymentRequests,
  useReviewPayment,
  type PaymentRequestItem,
} from "./api";
import { paymentRequestColumns } from "./columns";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { CircleCheck, Wallet } from "lucide-react";

const defs: FilterDef[] = [
  { key: "range", field: "createdAtUtc", type: "date-range" },
  {
    key: "status",
    type: "select",
    allLabel: "All statuses",
    defaultValue: String(PaymentRequestStatus.Pending),
    options: Object.entries(paymentStatusLabel).map(([value, label]) => ({
      value,
      label,
    })),
    icon: CircleCheck,
  },
  {
    key: "method",
    type: "select",
    allLabel: "All methods",
    options: Object.entries(paymentMethodLabel).map(([value, label]) => ({
      value,
      label,
    })),
    icon: Wallet,
  },
  { key: "search", type: "search", placeholder: "Search trx id, shop, payer…" },
];
export function PaymentRequestsPage() {
  const can = useCan();
  const list = useServerList({ defs });
  const { data, isLoading } = usePaymentRequests(list.request);
  const review = useReviewPayment();
  const [dialog, setDialog] = useState<{
    item: PaymentRequestItem;
    approve: boolean;
  } | null>(null);
  const [note, setNote] = useState("");

  const columns = paymentRequestColumns(
    can(Perm.BillingManage),
    (item, approve) => {
      setNote("");
      setDialog({ item, approve });
    },
  );
  return (
    <div className="space-y-4">
      <Filters filters={list.filters} />

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
              {dialog?.approve ? "Approve payment" : "Reject payment"}
            </DialogTitle>
            <DialogDescription>
              {dialog &&
                (dialog.approve
                  ? `Check ${paymentMethodLabel[dialog.item.method]} for transaction ${dialog.item.transactionId} of ${money(dialog.item.amount)} first. Approving creates a paid invoice and extends ${dialog.item.tenantName}'s ${dialog.item.planName} plan by ${dialog.item.months} month(s).`
                  : "The shop sees this reason and can submit again.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="review-note">
              {dialog?.approve ? "Note (optional)" : "Reason"}
            </Label>
            <Input
              id="review-note"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={dialog?.approve ? "default" : "destructive"}
              disabled={review.isPending || (!dialog?.approve && !note.trim())}
              onClick={() =>
                dialog &&
                review.mutate(
                  {
                    id: dialog.item.id,
                    approve: dialog.approve,
                    note: note.trim() || undefined,
                    rowVersion: dialog.item.rowVersion,
                  },
                  {
                    onSuccess: () => {
                      toast.success(
                        dialog.approve ? "Approved: plan extended" : "Rejected",
                      );
                      setDialog(null);
                    },
                    onError: (e) => applyProblem(e),
                  },
                )
              }
            >
              {dialog?.approve ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

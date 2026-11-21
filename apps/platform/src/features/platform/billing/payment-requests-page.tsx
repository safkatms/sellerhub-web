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

const pageSize = 20;
const select = "h-9 rounded-md border bg-background px-2 text-sm";

export function PaymentRequestsPage() {
  const can = useCan();
  const [status, setStatus] = useState<number | undefined>(
    PaymentRequestStatus.Pending,
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = usePaymentRequests({
    page,
    pageSize,
    status,
    search: search || undefined,
  });
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
          {Object.entries(paymentStatusLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <Input
          className="max-w-xs"
          placeholder="Search trx id, shop, payer…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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

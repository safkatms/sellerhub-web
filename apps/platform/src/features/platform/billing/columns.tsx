import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import {
  CouponDiscountType,
  InvoiceStatus,
  PaymentRequestStatus,
  invoiceStatusLabel,
  money,
  paymentMethodLabel,
  paymentStatusLabel,
  type Coupon,
  type Invoice,
  type PaymentRequestItem,
} from "./api";

export const paymentRequestColumns = (
  canManage: boolean,
  onReview: (item: PaymentRequestItem, approve: boolean) => void,
): AppColumnDef<PaymentRequestItem>[] => [
  {
    id: "createdAtUtc",
    header: "Submitted",
    accessorKey: "createdAtUtc",
    enableSorting: false,
    cell: ({ row }) => fmtDate(row.original.createdAtUtc),
  },
  {
    id: "shop",
    header: "Shop",
    accessorKey: "tenantName",
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        className="underline"
        href={`/platform/tenants/${row.original.tenantId}`}
      >
        {row.original.tenantName}
      </Link>
    ),
  },
  {
    id: "plan",
    header: "Plan",
    accessorKey: "planName",
    enableSorting: false,
    cell: ({ row }) => (
      <div>
        {row.original.planName} · {row.original.months} mo
        {row.original.couponCode && (
          <div className="text-xs text-muted-foreground">
            Coupon {row.original.couponCode}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "amount",
    header: "Paid",
    accessorKey: "amount",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      const short = r.expectedTotal != null && r.amount < r.expectedTotal;
      return (
        <div>
          <div
            className={short ? "font-medium text-destructive" : "font-medium"}
          >
            {money(r.amount, r.currency)}
          </div>
          {r.expectedTotal != null && (
            <div className="text-xs text-muted-foreground">
              Expected {money(r.expectedTotal, r.currency)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "method",
    header: "Method / Trx",
    accessorKey: "transactionId",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div>
          <div>
            {paymentMethodLabel[r.method]}{" "}
            <code className="text-xs select-all">{r.transactionId}</code>
          </div>
          {r.payerAccount && (
            <div className="text-xs text-muted-foreground">
              From {r.payerAccount}
            </div>
          )}
          {r.note && (
            <div
              className="max-w-56 truncate text-xs text-muted-foreground"
              title={r.note}
            >
              “{r.note}”
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div>
          <Badge
            variant={
              r.status === PaymentRequestStatus.Pending
                ? "secondary"
                : r.status === PaymentRequestStatus.Approved
                  ? "default"
                  : "outline"
            }
          >
            {paymentStatusLabel[r.status]}
          </Badge>
          {r.invoiceNumber && (
            <div className="text-xs text-muted-foreground">
              {r.invoiceNumber}
            </div>
          )}
          {r.reviewNote && (
            <div
              className="max-w-48 truncate text-xs text-muted-foreground"
              title={r.reviewNote}
            >
              {r.reviewNote}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.status === PaymentRequestStatus.Pending && canManage ? (
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={() => onReview(row.original, true)}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReview(row.original, false)}
          >
            Reject
          </Button>
        </div>
      ) : null,
  },
];

export const invoiceColumns = (
  showShop: boolean,
  canManage: boolean,
  actions: { onPaid: (i: Invoice) => void; onVoid: (i: Invoice) => void },
): AppColumnDef<Invoice>[] => [
  {
    id: "number",
    header: "Number",
    accessorKey: "number",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.number}</span>
    ),
  },
  ...(showShop
    ? [
        {
          id: "shop",
          header: "Shop",
          accessorKey: "tenantName",
          enableSorting: false,
          cell: ({ row }) => (
            <Link
              className="underline"
              href={`/platform/tenants/${row.original.tenantId}`}
            >
              {row.original.tenantName}
            </Link>
          ),
        } satisfies AppColumnDef<Invoice>,
      ]
    : []),
  {
    id: "plan",
    header: "Plan",
    accessorKey: "planName",
    enableSorting: false,
    cell: ({ row }) => `${row.original.planName} · ${row.original.months} mo`,
  },
  {
    id: "total",
    header: "Total",
    accessorKey: "total",
    enableSorting: false,
    cell: ({ row }) => {
      const i = row.original;
      return (
        <div>
          {money(i.total, i.currency)}
          {i.discount > 0 && (
            <div className="text-xs text-muted-foreground">
              −{money(i.discount, i.currency)} discount
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    enableSorting: false,
    cell: ({ row }) => {
      const i = row.original;
      return (
        <div>
          <Badge
            variant={
              i.status === InvoiceStatus.Paid
                ? "default"
                : i.status === InvoiceStatus.Unpaid
                  ? "secondary"
                  : "outline"
            }
          >
            {invoiceStatusLabel[i.status]}
          </Badge>
          {i.paymentReference && (
            <div className="text-xs text-muted-foreground">
              {i.paymentReference}
            </div>
          )}
          {i.voidReason && (
            <div className="text-xs text-muted-foreground">{i.voidReason}</div>
          )}
        </div>
      );
    },
  },
  {
    id: "issued",
    header: "Issued",
    accessorKey: "issuedAtUtc",
    enableSorting: false,
    cell: ({ row }) => {
      const i = row.original;
      return (
        <div>
          {fmtDate(i.issuedAtUtc)}
          {i.status === InvoiceStatus.Unpaid && i.dueAtUtc && (
            <div className="text-xs text-muted-foreground">
              Due {fmtDate(i.dueAtUtc)}
            </div>
          )}
          {i.paidAtUtc && (
            <div className="text-xs text-muted-foreground">
              Paid {fmtDate(i.paidAtUtc)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.status === InvoiceStatus.Unpaid && canManage ? (
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={() => actions.onPaid(row.original)}>
            Mark paid
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => actions.onVoid(row.original)}
          >
            Void
          </Button>
        </div>
      ) : null,
  },
];

export const couponColumns = (
  planName: (id: number | null) => string,
): AppColumnDef<Coupon>[] => [
  {
    id: "code",
    header: "Code",
    accessorKey: "code",
    cell: ({ row }) => (
      <div>
        <Link
          className="font-mono underline"
          href={`/platform/billing/coupons/${row.original.id}`}
        >
          {row.original.code}
        </Link>
        {row.original.description && (
          <div className="text-xs text-muted-foreground">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "discount",
    header: "Discount",
    accessorKey: "discountValue",
    cell: ({ row }) =>
      row.original.discountType === CouponDiscountType.Percent
        ? `${row.original.discountValue}%`
        : money(row.original.discountValue),
  },
  {
    id: "plan",
    header: "Plan",
    accessorKey: "planId",
    cell: ({ row }) => planName(row.original.planId),
  },
  {
    id: "used",
    header: "Used",
    accessorKey: "redeemedCount",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div>
          {c.redeemedCount}
          {c.maxRedemptions != null && ` / ${c.maxRedemptions}`}
          {c.maxPerTenant != null && (
            <div className="text-xs text-muted-foreground">
              {c.maxPerTenant} per shop
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "valid",
    header: "Valid",
    accessorKey: "validFromUtc",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.validFromUtc ? fmtDate(row.original.validFromUtc) : "Now"}{" "}
        →{" "}
        {row.original.validToUtc ? fmtDate(row.original.validToUtc) : "No end"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "isActive",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "outline"}>
        {row.original.isActive ? "Active" : "Off"}
      </Badge>
    ),
  },
];

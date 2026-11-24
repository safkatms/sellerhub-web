"use client";

import { CircleCheck } from "lucide-react";
import { Filters, type DateValue, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { invoiceStatusLabel } from "./api";
import { BillingSummary } from "./billing-summary";
import { InvoiceTable } from "./invoice-table";

const defs: FilterDef[] = [
  {
    key: "range",
    field: "issuedAtUtc",
    type: "date-range",
    defaultPreset: "this_month",
  },
  {
    key: "status",
    type: "select",
    allLabel: "All statuses",
    options: Object.entries(invoiceStatusLabel).map(([value, label]) => ({
      value,
      label,
    })),
    icon: CircleCheck,
  },
  {
    key: "search",
    type: "search",
    placeholder: "Search number, shop, reference…",
  },
];

export function InvoicesPage() {
  const list = useServerList({ defs });
  return (
    <div className="space-y-4">
      <Filters filters={list.filters} />
      <BillingSummary range={list.filters.values.range as DateValue} />
      <InvoiceTable list={list} />
    </div>
  );
}

"use client";

import { Filters, useFilters, type FilterDef } from "@sellerhub/ui/filters";
import { invoiceStatusLabel } from "./api";
import { BillingSummary } from "./billing-summary";
import { InvoiceTable } from "./invoice-table";

const defs: FilterDef[] = [
  { key: "range", type: "date-range" },
  {
    key: "status",
    type: "select",
    allLabel: "All statuses",
    options: Object.entries(invoiceStatusLabel).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: "search",
    type: "search",
    placeholder: "Search number, shop, reference…",
  },
];

export function InvoicesPage() {
  const f = useFilters(defs);
  return (
    <div className="space-y-4">
      <Filters filters={f} />
      <BillingSummary params={f.params} />
      <InvoiceTable params={f.params} resetKey={f.paramsKey} />
    </div>
  );
}

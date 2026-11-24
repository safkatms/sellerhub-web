"use client";

import { Coins, Hourglass, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@sellerhub/ui/lib/utils";
import { rangePresets, type RangePreset } from "@sellerhub/ui/lib/date-range";
import dayjs, { getDisplayZone } from "@sellerhub/ui/lib/dayjs";
import { dateRangeOf, type DateValue } from "@sellerhub/ui/filters";
import { money, useBillingSummary } from "./api";

const tones = {
  violet: { card: "from-primary/10", icon: "bg-primary/15 text-primary" },
  amber: { card: "from-warning/15", icon: "bg-warning/20 text-warning" },
  green: { card: "from-success/10", icon: "bg-success/15 text-success" },
} as const;

function Tile({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: keyof typeof tones;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "panel flex items-center gap-4 bg-gradient-to-br to-card p-5",
        tones[tone].card,
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
          tones[tone].icon,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function customRangeLabel(fromUtc?: string, toUtc?: string) {
  const zone = getDisplayZone();
  const format = (value: string) =>
    dayjs.utc(value).tz(zone).format("DD MMM YYYY");

  if (fromUtc && toUtc) {
    const from = format(fromUtc);
    const to = format(
      dayjs.utc(toUtc).tz(zone).subtract(1, "day").toISOString(),
    );
    return from === to ? from : `${from} – ${to}`;
  }
  if (fromUtc) return `From ${format(fromUtc)}`;
  if (toUtc) {
    const to = format(
      dayjs.utc(toUtc).tz(zone).subtract(1, "day").toISOString(),
    );
    return `Until ${to}`;
  }
  return "Custom range";
}

/** `range` is the same date-range filter value the invoice list uses. */
export function BillingSummary({ range }: { range?: DateValue }) {
  const { fromUtc, toUtc } = range ? dateRangeOf(range) : {};
  const { data: s } = useBillingSummary({ fromUtc, toUtc });
  const noRange = !fromUtc && !toUtc;
  const preset: RangePreset =
    range?.preset && range.preset !== "all"
      ? range.preset
      : noRange
        ? "all"
        : "custom";
  const rangeLabel =
    preset === "custom"
      ? customRangeLabel(fromUtc, toUtc)
      : rangePresets[preset];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Tile
        icon={Wallet}
        tone="violet"
        label="Payments to review"
        value={s?.pendingPaymentRequests ?? "-"}
      />
      <Tile
        icon={Hourglass}
        tone="amber"
        label="Unpaid invoices"
        value={s?.unpaidInvoices ?? "-"}
      />
      <Tile
        icon={Coins}
        tone="green"
        label={noRange ? "Paid (all time)" : `Paid · ${rangeLabel}`}
        value={money(s?.paidThisMonth)}
      />
    </div>
  );
}

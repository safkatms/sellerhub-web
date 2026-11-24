"use client";

import { Coins, Hourglass, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@sellerhub/ui/lib/utils";
import { rangePresets, type RangePreset } from "@sellerhub/ui/lib/date-range";
import { money, useBillingSummary, type DateRange } from "./api";

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

export function BillingSummary({
  params,
}: {
  params?: { fromUtc?: string; toUtc?: string; preset?: RangePreset };
}) {
  const { data: s } = useBillingSummary({
    fromUtc: params?.fromUtc,
    toUtc: params?.toUtc,
  });
  const noRange = !params?.fromUtc && !params?.toUtc;
  const preset: RangePreset = params?.preset ?? (noRange ? "all" : "custom");
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
        label={noRange ? "Paid (all time)" : `Paid · ${rangePresets[preset]}`}
        value={money(s?.paidThisMonth)}
      />
    </div>
  );
}

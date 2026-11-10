"use client";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Store,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@sellerhub/ui/lib/utils";
import { Badge } from "@sellerhub/ui/components/badge";
import { DataTable } from "@sellerhub/ui/data-table";
import { Skeleton } from "@sellerhub/ui/components/skeleton";
import { useLocalTable, type SortAccessors } from "@sellerhub/ui/hooks/use-local-table";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { useAuthStore } from "@/features/platform/auth/store";
import { useDashboard, type RecentSignup } from "./api";
import { recentSignupColumns } from "./columns";

/* ---------- building blocks ---------- */

const panel = "rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_24px_-12px_rgb(80_40_120/0.12)]";

const tones = {
  violet: "bg-violet-100 text-violet-600 shadow-[0_6px_16px_-4px] shadow-violet-400/60 dark:bg-violet-500/20 dark:text-violet-300",
  sky: "bg-sky-100 text-sky-600 shadow-[0_6px_16px_-4px] shadow-sky-400/60 dark:bg-sky-500/20 dark:text-sky-300",
  rose: "bg-rose-100 text-rose-600 shadow-[0_6px_16px_-4px] shadow-rose-400/60 dark:bg-rose-500/20 dark:text-rose-300",
} as const;

function StatTile({
  icon: Icon,
  tone,
  value,
  label,
  hint,
  hintClass,
}: {
  icon: LucideIcon;
  tone: keyof typeof tones;
  value: number;
  label: string;
  hint: string;
  hintClass?: string;
}) {
  return (
    <div className={cn(panel, "flex flex-col gap-5 p-5")}>
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-full", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight tabular-nums">
          {value.toLocaleString()}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </div>
      <div className={cn("text-xs font-medium", hintClass ?? "text-muted-foreground")}>
        {hint}
      </div>
    </div>
  );
}

const stateColor: Record<string, string> = {
  Active: "var(--success)",
  Grace: "var(--warning)",
  Expired: "var(--destructive)",
  Suspended: "var(--chart-5)",
  Closed: "var(--muted-foreground)",
};
const fallbackColors = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const daysLeft = (iso: string) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

/* ---------- skeleton ---------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 rounded-3xl border bg-muted/40 p-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-80" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

/* ---------- page ---------- */

const sortBy: SortAccessors<RecentSignup> = {
  name: (r) => r.name,
  slug: (r) => r.slug,
  plan: (r) => r.planCode,
  createdAt: (r) => r.createdAtUtc,
};

export function DashboardPage() {
  const { data } = useDashboard();
  const admin = useAuthStore((s) => s.admin);
  const recentSignups = useLocalTable(data?.recentSignups, {
    sortBy,
    initialSorting: [{ id: "createdAt", desc: true }],
    pageSize: 5,
  });

  if (!data) return <DashboardSkeleton />;

  const firstName = admin?.fullName?.split(" ")[0];
  const states = Object.entries(data.byState);
  const stateTotal = states.reduce((sum, [, n]) => sum + n, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Hero: greeting + stats + chart */}
      <section className="relative grid gap-5 overflow-hidden rounded-3xl border bg-muted/40 p-5 xl:grid-cols-[1.4fr_1fr]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,var(--border)_0_1px,transparent_1px_7px)]"
        />

        <div className="relative flex flex-col gap-6">
          <div className="pt-1">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}!
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here&apos;s how shops across the platform are doing today.
            </p>
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <StatTile
              icon={Store}
              tone="violet"
              value={data.totalTenants}
              label="Total shops"
              hint={`${data.byPlan.length} plans in use`}
            />
            <StatTile
              icon={UserPlus}
              tone="sky"
              value={data.newThisMonth}
              label="New this month"
              hint={data.newThisMonth > 0 ? `↑ ${data.newThisMonth} signups` : "No signups yet"}
              hintClass={data.newThisMonth > 0 ? "text-success" : undefined}
            />
            <StatTile
              icon={CalendarClock}
              tone="rose"
              value={data.expiringSoon.length}
              label="Expiring soon"
              hint={`Within ${data.expiringWithinDays} days`}
              hintClass={data.expiringSoon.length > 0 ? "text-destructive" : undefined}
            />
          </div>
        </div>

        <div className={cn(panel, "relative flex flex-col p-5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Shops by plan</h3>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Shops
            </span>
          </div>
          <div className="mt-4 h-60 flex-1">
            <ResponsiveContainer>
              <BarChart data={data.byPlan} barCategoryGap="28%">
                <defs>
                  <linearGradient id="planBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border)" />
                <XAxis
                  dataKey="planName"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="tenants"
                  name="Shops"
                  fill="url(#planBar)"
                  radius={[6, 6, 6, 6]}
                  maxBarSize={36}
                  background={{ fill: "var(--chart-2)", radius: 6, opacity: 0.45 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Table + side cards */}
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent signups</h3>
            <Link
              href="/platform/tenants"
              className="flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className={cn(panel, "overflow-hidden p-2")}>
            <DataTable columns={recentSignupColumns} {...recentSignups} />
          </div>
        </section>

        <div className="space-y-5">
          {/* Status breakdown */}
          <section className={cn(panel, "p-5")}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Shop status</h3>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
              {states.map(([state, n], i) => (
                <div
                  key={state}
                  style={{
                    width: `${(n / stateTotal) * 100}%`,
                    background: stateColor[state] ?? fallbackColors[i % fallbackColors.length],
                  }}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {states.map(([state, n], i) => (
                <li key={state} className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: stateColor[state] ?? fallbackColors[i % fallbackColors.length] }}
                  />
                  <span className="flex-1 text-muted-foreground">{state}</span>
                  <span className="font-medium tabular-nums">{n}</span>
                </li>
              ))}
              {states.length === 0 && <li className="text-muted-foreground">No data</li>}
            </ul>
          </section>

          {/* Expiring soon */}
          <section className={cn(panel, "p-5")}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Expiring soon</h3>
              <Badge variant="destructive">{data.expiringSoon.length}</Badge>
            </div>
            <ul className="mt-4 space-y-1">
              {data.expiringSoon.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  Nothing expiring in the next {data.expiringWithinDays} days 🎉
                </li>
              )}
              {data.expiringSoon.map((t) => {
                const left = daysLeft(t.planExpiresAtUtc);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                        {t.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {t.planCode} · {fmtDate(t.planExpiresAtUtc)}
                        </span>
                      </span>
                      <Badge
                        variant="destructive"
                        className={cn(
                          left > 3 && "bg-warning/15 text-amber-700 dark:bg-warning/20 dark:text-warning",
                        )}
                      >
                        {left}d left
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

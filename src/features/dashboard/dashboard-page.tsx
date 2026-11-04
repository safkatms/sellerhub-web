"use client";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalTable, type SortAccessors } from "@/hooks/use-local-table";
import { fmtDate } from "@/lib/dayjs";
import { useDashboard, type RecentSignup } from "./api";
import { recentSignupColumns } from "./columns";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="h-64">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const sortBy: SortAccessors<RecentSignup> = {
  name: (r) => r.name,
  slug: (r) => r.slug,
  plan: (r) => r.planCode,
  createdAt: (r) => r.createdAtUtc,
};

export function DashboardPage() {
  const { data } = useDashboard();
  const recentSignups = useLocalTable(data?.recentSignups, {
    sortBy,
    initialSorting: [{ id: "createdAt", desc: true }],
    pageSize: 5,
  });

  if (!data) return <DashboardSkeleton />;

  const stats = [
    ["Total shops", data.totalTenants],
    ["New this month", data.newThisMonth],
    [`Expiring in ${data.expiringWithinDays}d`, data.expiringSoon.length],
    ...Object.entries(data.byState).map(([k, v]) => [k, v] as [string, number]),
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {value}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shops by plan</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.byPlan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="planName" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tenants" fill="var(--primary)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expiring soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.expiringSoon.length === 0 && (
              <p className="text-muted-foreground">None</p>
            )}
            {data.expiringSoon.map((t) => (
              <div key={t.id} className="flex justify-between">
                <Link href={`/tenants/${t.id}`} className="underline">
                  {t.name}
                </Link>
                <span>
                  {t.planCode} · {fmtDate(t.planExpiresAtUtc)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent signups</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={recentSignupColumns} {...recentSignups} />
        </CardContent>
      </Card>
    </div>
  );
}

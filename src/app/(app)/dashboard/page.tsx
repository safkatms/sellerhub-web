"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
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
import { useDashboard } from "@/features/dashboard/api";
import { fmtDate } from "@/lib/dayjs";
import { recentSignupColumns } from "@/features/dashboard/columns";

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

export default function Dashboard() {
  const { data } = useDashboard();
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const pageSize = 5;

  const recentSignups = useMemo(() => {
    if (!data) return [];

    const items = [...data.recentSignups];
    const sort = sorting[0];
    if (!sort) return items;

    return items.sort((a, b) => {
      const left =
        sort.id === "name"
          ? a.name
          : sort.id === "slug"
            ? a.slug
            : sort.id === "plan"
              ? a.planCode
              : a.createdAtUtc;
      const right =
        sort.id === "name"
          ? b.name
          : sort.id === "slug"
            ? b.slug
            : sort.id === "plan"
              ? b.planCode
              : b.createdAtUtc;
      return String(left).localeCompare(String(right)) * (sort.desc ? -1 : 1);
    });
  }, [data, sorting]);
  const recentSignupPage = recentSignups.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

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
          <DataTable
            columns={recentSignupColumns}
            data={recentSignupPage}
            total={recentSignups.length}
            page={page}
            pageSize={pageSize}
            sorting={sorting}
            onPageChange={setPage}
            onSortingChange={(nextSorting) => {
              setSorting(nextSorting);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

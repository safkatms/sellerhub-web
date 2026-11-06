"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Skeleton } from "@sellerhub/ui/components/skeleton";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { useMe } from "@/features/auth/api";

/** Placeholder home screen until shop features (products, orders…) land. */
export function DashboardPage() {
  const { data: me, isLoading } = useMe();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {isLoading ? <Skeleton className="h-8 w-48" /> : `Welcome, ${me?.fullName ?? ""}`}
      </h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent>
          {me ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{me.email ?? "-"}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{me.phone ?? "-"}</dd>
              <dt className="text-muted-foreground">Role</dt>
              <dd>{me.isOwner ? "Owner" : "Staff"}</dd>
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd>{fmtDate(me.lastLoginAtUtc)}</dd>
            </dl>
          ) : (
            <Skeleton className="h-20 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

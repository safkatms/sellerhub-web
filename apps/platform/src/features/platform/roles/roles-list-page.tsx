"use client";

import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { Perm, useCan, usePlatformPermissions, useRoles } from "./api";

/** Platform roles: named bundles of permissions. Super admins hold every permission without a role. */
export function RolesListPage() {
  const can = useCan();
  const { data: roles, isLoading } = useRoles();
  const { data: permissions } = usePlatformPermissions();
  const editable = can(Perm.AdminManage);
  const nameOf = (code: string) =>
    permissions?.find((p) => p.code === code)?.name ?? code;

  if (isLoading) return <Spinner className="mx-auto mt-12 size-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          An admin gets the permissions of all their roles. Super admins have
          every permission.
        </p>
        {editable && (
          <Button
            nativeButton={false}
            render={<Link href="/platform/roles/new" />}
          >
            New role
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles?.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <Link className="underline" href={`/platform/roles/${r.id}`}>
                  {r.name}
                </Link>
                <Badge variant="secondary">{r.adminCount} admin(s)</Badge>
              </CardTitle>
              {r.description && (
                <p className="text-sm text-muted-foreground">{r.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {r.permissionCodes.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    No permissions
                  </span>
                )}
                {r.permissionCodes.map((c) => (
                  <Badge key={c} variant="outline">
                    {nameOf(c)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {roles?.length === 0 && (
          <p className="text-sm text-muted-foreground">No roles.</p>
        )}
      </div>
    </div>
  );
}

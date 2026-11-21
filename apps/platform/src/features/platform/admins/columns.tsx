import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import type { AdminItem } from "./api";

export const adminColumns: AppColumnDef<AdminItem>[] = [
  {
    id: "fullName",
    header: "Name",
    accessorKey: "fullName",
    cell: ({ row }) => (
      <Link className="underline" href={`/platform/admins/${row.original.id}`}>
        {row.original.fullName}
      </Link>
    ),
  },
  { id: "email", header: "Email", accessorKey: "email" },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === 1 ? "default" : "secondary"}>
        {row.original.status === 1 ? "Active" : "Disabled"}
      </Badge>
    ),
  },
  {
    id: "roles",
    header: "Access",
    accessorKey: "roles",
    enableSorting: false,
    cell: ({ row }) => {
      const a = row.original;
      if (a.isSuperAdmin) return <Badge>Super admin</Badge>;
      return a.roles?.length ? (
        <div className="flex flex-wrap gap-1">
          {a.roles.map((r) => (
            <Badge key={r} variant="outline">
              {r}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">View only</span>
      );
    },
  },
  {
    id: "twoFactor",
    header: "2FA",
    accessorKey: "twoFactorEnabled",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={row.original.twoFactorEnabled ? "default" : "outline"}>
        {row.original.twoFactorEnabled ? "On" : "Off"}
      </Badge>
    ),
  },
  {
    id: "lastLoginAtUtc",
    header: "Last login",
    accessorKey: "lastLoginAtUtc",
    cell: ({ row }) =>
      row.original.lastLoginAtUtc ? (
        <span className="text-xs">{fmtDate(row.original.lastLoginAtUtc)}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Never</span>
      ),
  },
];

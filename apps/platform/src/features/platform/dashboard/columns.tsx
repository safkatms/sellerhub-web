import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import type { RecentSignup } from "./api";

export const recentSignupColumns: AppColumnDef<RecentSignup>[] = [
  {
    id: "name",
    header: "Shop",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link
        href={`/platform/tenants/${row.original.id}`}
        className="flex items-center gap-3 font-medium hover:text-primary"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          {row.original.name.charAt(0).toUpperCase()}
        </span>
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "slug",
    header: "Slug",
    accessorKey: "slug",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    id: "plan",
    header: "Plan",
    accessorKey: "planCode",
    cell: ({ getValue }) => (
      <Badge variant="secondary" className="gap-1.5 px-2.5">
        {getValue<string>()}
      </Badge>
    ),
  },
  {
    id: "createdAt",
    header: "Created",
    accessorKey: "createdAtUtc",
    cell: ({ getValue }) => fmtDate(getValue<string>()),
  },
];

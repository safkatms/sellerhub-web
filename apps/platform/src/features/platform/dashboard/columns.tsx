import Link from "next/link";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import type { RecentSignup } from "./api";

export const recentSignupColumns: AppColumnDef<RecentSignup>[] = [
  {
    id: "name",
    header: "Shop",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link href={`/platform/tenants/${row.original.id}`} className="underline">
        {row.original.name}
      </Link>
    ),
  },
  { id: "slug", header: "Slug", accessorKey: "slug" },
  { id: "plan", header: "Plan", accessorKey: "planCode" },
  {
    id: "createdAt",
    header: "Created",
    accessorKey: "createdAtUtc",
    cell: ({ getValue }) => fmtDate(getValue<string>()),
  },
];
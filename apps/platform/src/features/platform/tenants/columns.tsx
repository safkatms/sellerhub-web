import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { planStateLabel, planStateVariant } from "@/lib/enums";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import type { TenantListItem } from "./api";

export const tenantColumns: AppColumnDef<TenantListItem>[] = [
  {
    id: "name",
    header: "Shop",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link className="underline" href={`/platform/tenants/${row.original.id}`}>
        {row.original.name}
      </Link>
    ),
  },
  { id: "slug", header: "Slug", accessorKey: "slug" },
  { id: "plan", header: "Plan", accessorKey: "planCode" },
  {
    id: "status",
    header: "State",
    accessorKey: "planState",
    cell: ({ getValue }) => {
      const s = getValue<number>();
      return <Badge variant={planStateVariant[s]}>{planStateLabel[s]}</Badge>;
    },
  },
  {
    id: "expiresAt",
    header: "Expires",
    accessorKey: "planExpiresAtUtc",
    cell: ({ getValue }) => fmtDate(getValue<string | null>()),
  },
  {
    id: "createdAt",
    header: "Created",
    accessorKey: "createdAtUtc",
    cell: ({ getValue }) => fmtDate(getValue<string>()),
  },
];

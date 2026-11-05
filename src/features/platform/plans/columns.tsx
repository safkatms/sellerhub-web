import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AppColumnDef } from "@/lib/table";
import type { Plan } from "./api";

export const planColumns: AppColumnDef<Plan>[] = [
  {
    id: "code",
    header: "Code",
    accessorKey: "code",
    cell: ({ row }) => (
      <Link className="underline" href={`/platform/plans/${row.original.id}`}>
        {row.original.code}
      </Link>
    ),
  },
  { id: "name", header: "Name", accessorKey: "name" },
  {
    id: "monthlyPrice",
    header: "Price/mo",
    accessorKey: "monthlyPrice",
    cell: ({ getValue }) => {
      const price = getValue<number | null>();
      return price != null ? `৳${price}` : "-";
    },
  },
  {
    id: "limits",
    header: "Limits",
    accessorKey: "limits",
    enableSorting: false,
    cell: ({ getValue }) =>
      getValue<Plan["limits"]>()
        .map((limit) => `${limit.key}: ${limit.value ?? "∞"}`)
        .join(" · "),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "isActive",
    cell: ({ getValue }) => {
      const active = getValue<boolean>();
      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

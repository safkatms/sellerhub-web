import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { PlatformAdminStatus } from "@/lib/enums";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import type { AdminItem } from "./api";

type ToggleAdmin = {
  mutate: (
    value: { id: string; enable: boolean },
    options: { onError: (error: unknown) => void },
  ) => void;
};

export const adminColumns = (
  toggle: ToggleAdmin,
  onError: (error: unknown) => void,
): AppColumnDef<AdminItem>[] => [
  { id: "fullName", header: "Name", accessorKey: "fullName" },
  { id: "email", header: "Email", accessorKey: "email" },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ getValue }) => {
      const active = getValue<number>() === PlatformAdminStatus.Active;
      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Active" : "Disabled"}
        </Badge>
      );
    },
  },
  {
    id: "lastLoginAtUtc",
    header: "Last login",
    accessorKey: "lastLoginAtUtc",
    cell: ({ getValue }) => fmtDate(getValue<string | null>()),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const admin = row.original;
      const active = admin.status === PlatformAdminStatus.Active;
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toggle.mutate(
              { id: admin.id, enable: !active },
              { onError },
            )
          }
        >
          {active ? "Disable" : "Enable"}
        </Button>
      );
    },
  },
];

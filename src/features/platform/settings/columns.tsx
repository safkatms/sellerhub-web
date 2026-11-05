import { fmtDate } from "@/lib/dayjs";
import type { AppColumnDef } from "@/lib/table";
import type { PlatformSetting } from "./api";
import { settingLabel } from "./labels";
import { SettingValueCell } from "./setting-value-cell";

export const settingColumns: AppColumnDef<PlatformSetting>[] = [
  {
    id: "key",
    header: "Setting",
    accessorKey: "key",
    cell: ({ getValue }) => (
      <div className="space-y-0.5">
        <div className="font-medium">{settingLabel(getValue<string>())}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {getValue<string>()}
        </div>
      </div>
    ),
  },
  {
    id: "value",
    header: "Value",
    accessorKey: "value",
    enableSorting: false,
    cell: ({ row }) => <SettingValueCell setting={row.original} />,
  },
  {
    id: "description",
    header: "Description",
    accessorKey: "description",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string | null>() ?? "-"}
      </span>
    ),
  },
  {
    id: "updatedAtUtc",
    header: "Updated",
    accessorKey: "updatedAtUtc",
    cell: ({ getValue }) => (
      <span className="text-xs">{fmtDate(getValue<string>())}</span>
    ),
  },
];

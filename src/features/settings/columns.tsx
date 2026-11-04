import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyProblem } from "@/lib/api/errors";
import { fmtDate } from "@/lib/dayjs";
import type { AppColumnDef } from "@/lib/table";
import { useUpdateSetting, type PlatformSetting } from "./api";

function ValueCell({ setting }: { setting: PlatformSetting }) {
  const [value, setValue] = useState(setting.value);
  const update = useUpdateSetting();
  const dirty = value !== setting.value;

  return (
    <div className="flex items-center gap-2">
      <Input value={value} onChange={(event) => setValue(event.target.value)} />
      <Button
        size="sm"
        disabled={!dirty || update.isPending}
        onClick={() =>
          update.mutate(
            { key: setting.key, value },
            { onError: (error) => applyProblem(error) },
          )
        }
      >
        Save
      </Button>
    </div>
  );
}

export const settingColumns: AppColumnDef<PlatformSetting>[] = [
  {
    id: "key",
    header: "Key",
    accessorKey: "key",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue<string>()}</span>
    ),
  },
  {
    id: "value",
    header: "Value",
    accessorKey: "value",
    enableSorting: false,
    cell: ({ row }) => <ValueCell setting={row.original} />,
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

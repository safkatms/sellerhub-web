"use client";

import { DataTable } from "@sellerhub/ui/data-table";
import { useLocalTable, type SortAccessors } from "@sellerhub/ui/hooks/use-local-table";
import { useSettings, type PlatformSetting } from "./api";
import { settingColumns } from "./columns";
import { settingLabel } from "./labels";

const sortBy: SortAccessors<PlatformSetting> = {
  key: (s) => settingLabel(s.key),
  description: (s) => s.description,
  updatedAtUtc: (s) => s.updatedAtUtc,
};

export function SettingsPage() {
  const { data, isLoading } = useSettings();
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "key", desc: false }],
  });

  return <DataTable columns={settingColumns} loading={isLoading} {...table} />;
}

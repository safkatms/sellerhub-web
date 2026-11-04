"use client";

import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { useSettings } from "@/features/settings/api";
import { settingColumns } from "@/features/settings/columns";

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "key", desc: false },
  ]);
  const pageSize = 10;

  const sortedSettings = useMemo(() => {
    const items = [...(data ?? [])];
    const sort = sorting[0];
    if (!sort) return items;

    return items.sort((a, b) => {
      const left =
        sort.id === "description"
          ? a.description ?? ""
          : sort.id === "updatedAtUtc"
            ? a.updatedAtUtc
            : a.key;
      const right =
        sort.id === "description"
          ? b.description ?? ""
          : sort.id === "updatedAtUtc"
            ? b.updatedAtUtc
            : b.key;
      return String(left).localeCompare(String(right)) * (sort.desc ? -1 : 1);
    });
  }, [data, sorting]);

  return (
    <DataTable
      columns={settingColumns}
      data={sortedSettings.slice((page - 1) * pageSize, page * pageSize)}
      loading={isLoading}
      total={sortedSettings.length}
      page={page}
      pageSize={pageSize}
      sorting={sorting}
      onPageChange={setPage}
      onSortingChange={(nextSorting) => {
        setSorting(nextSorting);
        setPage(1);
      }}
    />
  );
}

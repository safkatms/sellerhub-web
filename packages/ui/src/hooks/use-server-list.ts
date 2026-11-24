"use client";
import { useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { Filter, ListRequest } from "@sellerhub/api-client/query";
import { useFilters, type FilterDef } from "../filters";

const none: Filter[] = [];

/**
 * Filters + sort + page for a server-paged list, as one ListRequest.
 *
 *   const l = useServerList({ defs, initialSort: [{ id: "createdAt", desc: true }] });
 *   const q = useThings(l.request);
 *   <Filters filters={l.filters} />
 *   <DataTable {...l.table} columns={columns} data={q.data?.items ?? []} total={q.data?.totalCount ?? 0} />
 *
 * `defs` must be stable (module level or useMemo). Column ids are sent as
 * `sortBy`, so they must match the list's sort keys on the backend. Changing a
 * filter or the sort goes back to page 1. `fixed` filters are always sent
 * (e.g. the shop on a shop's own billing tab) and are not shown as controls.
 */
export function useServerList({
  defs,
  initialSort = [],
  pageSize = 20,
  fixed = none,
}: {
  defs: FilterDef[];
  initialSort?: SortingState;
  pageSize?: number;
  fixed?: Filter[];
}) {
  const filters = useFilters(defs);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>(initialSort);

  // Reset during render (not in an effect) so the old page is never fetched with the new filters.
  const [seenKey, setSeenKey] = useState(filters.key);
  if (seenKey !== filters.key) {
    setSeenKey(filters.key);
    setPage(1);
  }

  const sort = sorting[0];
  const request: ListRequest = {
    page,
    pageSize,
    search: filters.search,
    sortBy: sort?.id,
    desc: sort?.desc,
    filters: fixed.length ? [...fixed, ...filters.filters] : filters.filters,
  };

  return {
    filters,
    request,
    table: {
      page,
      pageSize,
      sorting,
      onPageChange: setPage,
      onSortingChange: (next: SortingState) => {
        setSorting(next);
        setPage(1);
      },
    },
  };
}

export type ServerList = ReturnType<typeof useServerList>;

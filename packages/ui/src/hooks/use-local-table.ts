"use client";
import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";

export type SortValue = string | number | null | undefined;
/** Column id -> value used to sort that column. Define it at module level so it stays referentially stable. */
export type SortAccessors<T> = Record<string, (row: T) => SortValue>;

const compare = (a: SortValue, b: SortValue) =>
    typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""));

/**
 * Client-side sorting + pagination for endpoints that return the full list.
 * The result spreads straight into <DataTable {...table} />.
 */
export function useLocalTable<T>(
    rows: T[] | undefined,
    { sortBy, initialSorting = [], pageSize = 10 }: { sortBy: SortAccessors<T>; initialSorting?: SortingState; pageSize?: number },
) {
    const [page, setPage] = useState(1);
    const [sorting, setSorting] = useState<SortingState>(initialSorting);

    const sorted = useMemo(() => {
        const items = [...(rows ?? [])];
        const sort = sorting[0];
        const get = sort && sortBy[sort.id];
        if (!get) return items;
        const dir = sort.desc ? -1 : 1;
        return items.sort((a, b) => compare(get(a), get(b)) * dir);
    }, [rows, sorting, sortBy]);

    return {
        data: sorted.slice((page - 1) * pageSize, page * pageSize),
        total: sorted.length,
        page,
        pageSize,
        sorting,
        onPageChange: setPage,
        onSortingChange: (next: SortingState) => {
            setSorting(next);
            setPage(1);
        },
    };
}

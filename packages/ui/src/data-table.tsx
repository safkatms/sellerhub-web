"use client";
import {
  useTable,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sellerhub/ui/components/table";
import { Button } from "@sellerhub/ui/components/button";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { appFeatures, type AppColumnDef } from "@sellerhub/ui/lib/table";

type Props<T extends RowData> = {
  columns: AppColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  sorting: SortingState;
  onPageChange: (p: number) => void;
  onSortingChange: (s: SortingState) => void;
  loading?: boolean;
};

export function DataTable<T extends RowData>({
  columns,
  data,
  total,
  page,
  pageSize,
  sorting,
  onPageChange,
  onSortingChange,
  loading = false,
}: Props<T>) {
  const table = useTable({
    features: appFeatures,
    columns,
    data,
    manualSorting: true,
    state: { sorting },
    onSortingChange: (u) =>
      onSortingChange(typeof u === "function" ? u(sorting) : u),
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <div className="panel overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary [&_tr]:border-b">
            {table.getHeaderGroups().map((g) => (
              <TableRow key={g.id}>
                {g.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="h-12 cursor-pointer select-none px-4 text-sm font-semibold text-secondary-foreground"
                  >
                    <table.FlexRender header={h} />
                    {{ asc: " ↑", desc: " ↓" }[
                      h.column.getIsSorted() as string
                    ] ?? ""}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((r) => (
                <TableRow key={r.id}>
                  {r.getAllCells().map((c) => (
                    <TableCell key={c.id}>
                      <table.FlexRender cell={c} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>
          Page {page} of {pages} · {total} total
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

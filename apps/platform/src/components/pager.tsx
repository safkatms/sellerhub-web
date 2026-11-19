"use client";

import { Button } from "@sellerhub/ui/components/button";

/** Previous / next pager for server-paged lists that do not use DataTable. */
export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground">Page {page} of {pages} · {total} total</span>
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

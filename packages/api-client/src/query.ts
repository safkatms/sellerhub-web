/**
 * The one request shape every server-paged list sends. The backend applies it
 * through a per-list whitelist (QueryMap<T>), so `field` must be a name that
 * list allows. Unknown fields and bad values come back as a 400.
 *
 *   GET …?search=abc&filter=status:in:1,2&filter=issuedAtUtc:gte:2026-11-01T00:00:00Z
 *        &sortBy=issued&desc=true&page=1&pageSize=20
 */
export type FilterOp =
  | "eq"
  | "ne"
  | "in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  /** value true = IS NULL, false = IS NOT NULL */
  | "null";

export type FilterValue = string | number | boolean;

export type Filter = {
  field: string;
  op: FilterOp;
  value: FilterValue | FilterValue[];
};

export type ListRequest = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  desc?: boolean;
  filters?: Filter[];
};

const isBlank = (v: Filter["value"]) =>
  Array.isArray(v) ? v.length === 0 : v === "" || v == null;

/** `field:op:value`; `in` joins its values with commas. */
export const encodeFilter = (f: Filter) =>
  `${f.field}:${f.op}:${Array.isArray(f.value) ? f.value.join(",") : String(f.value)}`;

/**
 * Query string for a ListRequest. Pass as axios `params`; a URLSearchParams
 * keeps the repeated `filter` keys (axios would otherwise send `filter[]=`).
 */
export function toListParams(req: ListRequest): URLSearchParams {
  const p = new URLSearchParams();
  if (req.page) p.set("page", String(req.page));
  if (req.pageSize) p.set("pageSize", String(req.pageSize));
  const search = req.search?.trim();
  if (search) p.set("search", search);
  if (req.sortBy) {
    p.set("sortBy", req.sortBy);
    if (req.desc) p.set("desc", "true");
  }
  for (const f of req.filters ?? []) if (!isBlank(f.value)) p.append("filter", encodeFilter(f));
  return p;
}

/** A stable value for React Query keys and reset-paging effects. */
export const listKey = (req: ListRequest) => toListParams(req).toString();

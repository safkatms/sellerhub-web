export type ProblemDetails = {
    title?: string; status: number; instance?: string; code?: string; traceId?: string;
    errors?: Record<string, string[]>;
};

export type Paged<T> = { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number };

export type { Filter, FilterOp, ListRequest } from "./query";

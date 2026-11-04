import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paged, PagedRequest } from "@/lib/api/types";

export type LogQuery = PagedRequest & { tenantId?: string; from?: string; to?: string };
export type AuditLog = { id: number; tenantId: string | null; userId: string | null; action: string; entityName: string | null; entityId: string | null; oldValues: string | null; newValues: string | null; ipAddress: string | null; correlationId: string | null; createdAtUtc: string };
export type LoginLog = { id: number; tenantId: string | null; userId: string | null; identifier: string; isSuccess: boolean; failureReason: string | null; ipAddress: string | null; userAgent: string | null; correlationId: string | null; createdAtUtc: string };
export type ErrorLog = { id: number; traceId: string; tenantId: string | null; userId: string | null; httpMethod: string | null; path: string | null; statusCode: number | null; errorCode: string | null; message: string | null; createdAtUtc: string };
export type ErrorLogDetails = ErrorLog & { details: string | null };

const useLog = <T,>(kind: "audit" | "logins" | "errors", q: LogQuery & Record<string, unknown>) =>
    useQuery({
        queryKey: ["logs", kind, q],
        queryFn: () => api.get<Paged<T>>(`/api/platform/logs/${kind}`, { params: q }).then((r) => r.data),
        placeholderData: keepPreviousData,
    });

export const useAuditLogs = (q: LogQuery) => useLog<AuditLog>("audit", q);
export const useLoginLogs = (q: LogQuery & { isSuccess?: boolean }) => useLog<LoginLog>("logins", q);
export const useErrorLogs = (q: LogQuery & { traceId?: string; statusCode?: number }) => useLog<ErrorLog>("errors", q);
export const useErrorLog = (id: number | null) =>
    useQuery({
        queryKey: ["logs", "error", id],
        enabled: id !== null,
        queryFn: () => api.get<ErrorLogDetails>(`/api/platform/logs/errors/${id}`).then((r) => r.data),
    });
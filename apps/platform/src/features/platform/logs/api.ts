import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";
import type { Paged, PagedRequest } from "@sellerhub/api-client/types";

export type LogQuery = PagedRequest & { tenantId?: string; from?: string; to?: string };
export type AuditLog = { id: number; tenantId: string | null; userId: string | null; action: string; entityName: string | null; entityId: string | null; oldValues: string | null; newValues: string | null; ipAddress: string | null; correlationId: string | null; createdAtUtc: string;
    /** 1 shop user, 2 platform admin, 3 system; null on old rows. */
    actorType: number | null; impersonatorAdminId: string | null };
export type ImpersonationLog = {
    id: number; adminId: string; adminName: string | null; tenantId: string; tenantName: string | null; userId: string;
    reason: string; ipAddress: string | null; userAgent: string | null; startedAtUtc: string; expiresAtUtc: string; endedAtUtc: string | null;
};
export type LoginLog = { id: number; tenantId: string | null; userId: string | null; identifier: string; isSuccess: boolean; failureReason: string | null; ipAddress: string | null; deviceName: string | null; userAgent: string | null; correlationId: string | null; createdAtUtc: string };
export type ErrorLog = { id: number; traceId: string; tenantId: string | null; userId: string | null; httpMethod: string | null; path: string | null; statusCode: number | null; errorCode: string | null; message: string | null; createdAtUtc: string };
export type ErrorLogDetails = ErrorLog & { details: string | null };

const useLog = <T,>(kind: "audit" | "logins" | "errors" | "impersonations", q: LogQuery & Record<string, unknown>, enabled: boolean) =>
    useQuery({
        queryKey: ["logs", kind, q],
        enabled,
        queryFn: () => api.get<Paged<T>>(`/api/platform/logs/${kind}`, { params: q }).then((r) => r.data),
        placeholderData: keepPreviousData,
    });

export const useAuditLogs = (q: LogQuery, enabled = true) => useLog<AuditLog>("audit", q, enabled);
export const useLoginLogs = (q: LogQuery & { isSuccess?: boolean }, enabled = true) => useLog<LoginLog>("logins", q, enabled);
export const useErrorLogs = (q: LogQuery & { traceId?: string; statusCode?: number }, enabled = true) =>
    useLog<ErrorLog>("errors", q, enabled);
export const useImpersonationLogs = (q: LogQuery, enabled = true) => useLog<ImpersonationLog>("impersonations", q, enabled);
export const useErrorLog = (id: number | null) =>
    useQuery({
        queryKey: ["logs", "error", id],
        enabled: id !== null,
        queryFn: () => api.get<ErrorLogDetails>(`/api/platform/logs/errors/${id}`).then((r) => r.data),
    });

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";
import { toListParams, type ListRequest } from "@sellerhub/api-client/query";
import type { Paged } from "@sellerhub/api-client/types";
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

const useLog = <T,>(kind: "audit" | "logins" | "errors" | "impersonations", q: ListRequest, enabled: boolean) =>
    useQuery({
        queryKey: ["logs", kind, q],
        enabled,
        queryFn: () => api.get<Paged<T>>(`/api/platform/logs/${kind}`, { params: toListParams(q) }).then((r) => r.data),
        placeholderData: keepPreviousData,
    });

/** Filters: tenantId, userId, entityName, entityId, actorType, createdAtUtc. Search: action. */
export const useAuditLogs = (q: ListRequest, enabled = true) => useLog<AuditLog>("audit", q, enabled);
/** Filters: tenantId, userId, isSuccess, createdAtUtc. Search: identifier. */
export const useLoginLogs = (q: ListRequest, enabled = true) => useLog<LoginLog>("logins", q, enabled);
/** Filters: tenantId, traceId, statusCode, errorCode, createdAtUtc. Search: path, message. */
export const useErrorLogs = (q: ListRequest, enabled = true) => useLog<ErrorLog>("errors", q, enabled);
/** Filters: tenantId, adminId, startedAtUtc, endedAtUtc. Search: reason. */
export const useImpersonationLogs = (q: ListRequest, enabled = true) => useLog<ImpersonationLog>("impersonations", q, enabled);
export const useErrorLog = (id: number | null) =>
    useQuery({
        queryKey: ["logs", "error", id],
        enabled: id !== null,
        queryFn: () => api.get<ErrorLogDetails>(`/api/platform/logs/errors/${id}`).then((r) => r.data),
    });

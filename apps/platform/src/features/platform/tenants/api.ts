import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";
import type { Paged, PagedRequest } from "@sellerhub/api-client/types";

export type TenantListItem = {
    id: string; name: string; slug: string; email: string | null; phone: string | null;
    planId: number; planCode: string; planName: string; planExpiresAtUtc: string | null;
    status: number; planState: number; createdAtUtc: string;
};
export type TenantOwner = { id: string; fullName: string; email: string | null; phone: string | null; lastLoginAtUtc: string | null };
export type Tenant = Omit<TenantListItem, "createdAtUtc"> & {
    graceEndsAtUtc: string | null; timeZone: string; language: string; currency: string;
    userCount: number; owner: TenantOwner | null; createdAtUtc: string; rowVersion: string;
};
export type TenantListQuery = PagedRequest & { status?: number; planId?: number; planState?: number };

export type CreateTenantBody = {
    name: string; slug?: string; email?: string; phone?: string; timeZone?: string; language?: string; currency?: string; planId?: number;
    ownerFullName: string; ownerEmail?: string; ownerPhone?: string;
};
export type UpdateTenantBody = {
    name: string; email?: string; phone?: string; timeZone: string; language: string; currency: string; rowVersion: string;
};

const key = ["tenants"] as const;
const base = "/api/platform/tenants";

export const useTenants = (q: TenantListQuery) =>
    useQuery({
        queryKey: [...key, "list", q],
        queryFn: () => api.get<Paged<TenantListItem>>(base, { params: q }).then((r) => r.data),
        placeholderData: keepPreviousData,
    });

export const useTenant = (id: string) =>
    useQuery({ queryKey: [...key, id], enabled: Boolean(id), queryFn: () => api.get<Tenant>(`${base}/${id}`).then((r) => r.data) });

export const useCreateTenant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (b: CreateTenantBody) =>
            api.post<{ tenant: Tenant; ownerTemporaryPassword: string }>(base, b).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
};

export const useUpdateTenant = (id: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (b: UpdateTenantBody) => api.put<Tenant>(`${base}/${id}`, b).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
};

/** Short-lived shop-user token with no refresh token. */
export type ImpersonationResult = {
    accessToken: string; expiresInSeconds: number; tenantId: string; userId: string; userName: string;
};

export const useTenantAction = (id: string) => {
    const qc = useQueryClient();
    const run = <T,>(path: string, body?: unknown) => api.post<T>(`${base}/${id}/${path}`, body).then((r) => r.data);
    const ok = () => qc.invalidateQueries({ queryKey: key });
    return {
        suspend: useMutation({ mutationFn: (reason?: string) => run<Tenant>("suspend", { reason }), onSuccess: ok }),
        reactivate: useMutation({ mutationFn: () => run<Tenant>("reactivate"), onSuccess: ok }),
        close: useMutation({ mutationFn: (reason?: string) => run<Tenant>("close", { reason }), onSuccess: ok }),
        resetPassword: useMutation({ mutationFn: () => run<{ temporaryPassword: string }>("reset-owner-password") }),
        impersonate: useMutation({
            mutationFn: (reason: string) => run<ImpersonationResult>("impersonate", { reason }),
        }),
    };
};

export type Subscription = {
    id: string; planId: number; planCode: string; planName: string; startsAtUtc: string; endsAtUtc: string;
    source: number; amount: number | null; currency: string; paymentReference: string | null;
    notes: string | null; createdAtUtc: string;
};

export const useSubscriptions = (tenantId: string) =>
    useQuery({
        queryKey: [...key, tenantId, "subs"],
        enabled: Boolean(tenantId),
        queryFn: () => api.get<Subscription[]>(`${base}/${tenantId}/subscriptions`).then((r) => r.data),
    });

export const useRecordSubscription = (tenantId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (b: { planId: number; months: number; amount?: number; paymentReference?: string; notes?: string }) =>
            api.post<Subscription>(`${base}/${tenantId}/subscriptions`, b).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
};
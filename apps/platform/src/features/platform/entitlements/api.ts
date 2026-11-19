import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";

/** 0 = never resets, 1 = resets every month (UTC). */
export const LimitResetPeriod = { None: 0, Monthly: 1 } as const;
/** Where the effective value comes from. */
export type EntitlementSource = "Override" | "Plan" | "None";

// ---------------------------------------------------------------- catalog

export type LimitDefinition = {
    key: string; name: string; description: string | null; unit: string;
    resetPeriod: number; sortOrder: number; isActive: boolean;
};
export type Feature = {
    id: number; code: string; module: string; name: string; description: string | null; sortOrder: number; isActive: boolean;
};

const catalogKey = ["catalog"] as const;

export const useLimitDefinitions = () =>
    useQuery({
        queryKey: [...catalogKey, "limits"],
        queryFn: () => api.get<LimitDefinition[]>("/api/platform/catalog/limits").then((r) => r.data),
        staleTime: 5 * 60_000,
    });

export const useFeatures = () =>
    useQuery({
        queryKey: [...catalogKey, "features"],
        queryFn: () => api.get<Feature[]>("/api/platform/catalog/features").then((r) => r.data),
        staleTime: 5 * 60_000,
    });

// ---------------------------------------------------------------- plan features

export const usePlanFeatures = (planId: number | undefined) =>
    useQuery({
        queryKey: ["plans", planId, "features"],
        enabled: planId !== undefined,
        queryFn: () => api.get<string[]>(`/api/platform/plans/${planId}/features`).then((r) => r.data),
    });

export const useSetPlanFeatures = (planId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (featureCodes: string[]) =>
            api.put<string[]>(`/api/platform/plans/${planId}/features`, { featureCodes }).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["plans", planId, "features"] });
            // Shops on this plan may have gained or lost features.
            qc.invalidateQueries({ queryKey: ["tenants"] });
        },
    });
};

// ---------------------------------------------------------------- per shop

export type LimitOverride = {
    id: string; value: number | null; expiresAtUtc: string | null; reason: string | null;
    createdAtUtc: string; createdBy: string | null; rowVersion: string;
};
/** Null values = unlimited. `override` is the live row even when expired (`overrideActive` false). */
export type TenantLimit = {
    key: string; name: string; unit: string; resetPeriod: number;
    hasPlanValue: boolean; planValue: number | null;
    override: LimitOverride | null; overrideActive: boolean;
    source: EntitlementSource; effectiveValue: number | null; isUnlimited: boolean;
    periodStartUtc: string; used: number; remaining: number | null;
};
export type SetLimitOverrideBody = { value: number | null; expiresAtUtc: string | null; reason: string; rowVersion: string | null };

export type FeatureOverride = {
    id: string; isEnabled: boolean; expiresAtUtc: string | null; reason: string | null;
    createdAtUtc: string; createdBy: string | null; rowVersion: string;
};
export type TenantFeature = {
    code: string; module: string; name: string; inPlan: boolean;
    override: FeatureOverride | null; overrideActive: boolean;
    source: EntitlementSource; isEnabled: boolean;
};
export type SetFeatureOverrideBody = { isEnabled: boolean; expiresAtUtc: string | null; reason: string; rowVersion: string | null };

const base = "/api/platform/tenants";
const limitsKey = (tenantId: string) => ["tenants", tenantId, "limits"] as const;
const featuresKey = (tenantId: string) => ["tenants", tenantId, "features"] as const;

export const useTenantLimits = (tenantId: string) =>
    useQuery({
        queryKey: limitsKey(tenantId),
        enabled: Boolean(tenantId),
        queryFn: () => api.get<TenantLimit[]>(`${base}/${tenantId}/limits`).then((r) => r.data),
    });

export const useTenantFeatures = (tenantId: string) =>
    useQuery({
        queryKey: featuresKey(tenantId),
        enabled: Boolean(tenantId),
        queryFn: () => api.get<TenantFeature[]>(`${base}/${tenantId}/features`).then((r) => r.data),
    });

export const useLimitOverride = (tenantId: string) => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: limitsKey(tenantId) });
    const path = (key: string) => `${base}/${tenantId}/limits/${encodeURIComponent(key)}`;
    return {
        set: useMutation({
            mutationFn: ({ key, body }: { key: string; body: SetLimitOverrideBody }) =>
                api.put<TenantLimit>(path(key), body).then((r) => r.data),
            onSuccess: ok,
        }),
        remove: useMutation({
            mutationFn: ({ key, reason }: { key: string; reason?: string }) =>
                api.post<TenantLimit>(`${path(key)}/remove-override`, { reason }).then((r) => r.data),
            onSuccess: ok,
        }),
    };
};

export const useFeatureOverride = (tenantId: string) => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: featuresKey(tenantId) });
    const path = (code: string) => `${base}/${tenantId}/features/${encodeURIComponent(code)}`;
    return {
        set: useMutation({
            mutationFn: ({ code, body }: { code: string; body: SetFeatureOverrideBody }) =>
                api.put<TenantFeature>(path(code), body).then((r) => r.data),
            onSuccess: ok,
        }),
        remove: useMutation({
            mutationFn: ({ code, reason }: { code: string; reason?: string }) =>
                api.post<TenantFeature>(`${path(code)}/remove-override`, { reason }).then((r) => r.data),
            onSuccess: ok,
        }),
    };
};

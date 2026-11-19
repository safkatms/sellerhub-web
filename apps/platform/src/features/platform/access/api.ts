import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";
import { useAuthStore } from "@/features/platform/auth/store";

/** Platform permission codes (Scripts/05_platform_rbac_audit.sql). */
export const Perm = {
    TenantManage: "tenant.manage",
    TenantStatus: "tenant.status",
    TenantImpersonate: "tenant.impersonate",
    TenantPasswordReset: "tenant.password_reset",
    TenantEntitlements: "tenant.entitlements",
    TenantCrm: "tenant.crm",
    PlanManage: "plan.manage",
    BillingManage: "billing.manage",
    AnnouncementManage: "announcement.manage",
    NotificationManage: "notification.manage",
    SupportManage: "support.manage",
    OpsManage: "ops.manage",
    LogsView: "logs.view",
    SettingsManage: "settings.manage",
    AdminManage: "admin.manage",
} as const;
export type PermCode = (typeof Perm)[keyof typeof Perm];

export type MyAccess = { isSuperAdmin: boolean; permissions: string[]; twoFactorEnabled: boolean };
export type PlatformPermission = { id: number; code: string; module: string; name: string; description: string | null };
export type PlatformRole = { id: number; name: string; description: string | null; permissionCodes: string[]; adminCount: number; rowVersion: string };
export type AdminAccess = { adminId: string; isSuperAdmin: boolean; roleIds: number[]; effectivePermissions: string[] };

const base = "/api/platform/access";
const myKey = ["access", "me"] as const;

export const useMyAccess = () => {
    const adminId = useAuthStore((s) => s.admin?.id);
    return useQuery({
        queryKey: [...myKey, adminId],
        enabled: Boolean(adminId),
        staleTime: 60_000,
        queryFn: () => api.get<MyAccess>(`${base}/me`).then((r) => r.data),
    });
};

/**
 * `can(code)` for hiding buttons and pages. False while loading; the API still checks every request.
 * A super admin can do everything.
 */
export const useCan = () => {
    const { data } = useMyAccess();
    return (code: PermCode) => Boolean(data && (data.isSuperAdmin || data.permissions.includes(code)));
};

export const usePlatformPermissions = () =>
    useQuery({ queryKey: ["access", "permissions"], staleTime: 5 * 60_000,
        queryFn: () => api.get<PlatformPermission[]>(`${base}/permissions`).then((r) => r.data) });

export const useRoles = () =>
    useQuery({ queryKey: ["access", "roles"], queryFn: () => api.get<PlatformRole[]>(`${base}/roles`).then((r) => r.data) });

export type SaveRoleBody = { name: string; description: string | null; permissionCodes: string[]; rowVersion: string | null };

export const useSaveRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id?: number; body: SaveRoleBody }) =>
            (id ? api.put<PlatformRole>(`${base}/roles/${id}`, body) : api.post<PlatformRole>(`${base}/roles`, body)).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["access"] }),
    });
};

export const useDeleteRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`${base}/roles/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["access"] });
            qc.invalidateQueries({ queryKey: ["admins"] });
        },
    });
};

export const useAdminAccess = (adminId: string | null) =>
    useQuery({
        queryKey: ["access", "admin", adminId],
        enabled: Boolean(adminId),
        queryFn: () => api.get<AdminAccess>(`${base}/admins/${adminId}`).then((r) => r.data),
    });

export const useSetAdminAccess = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ adminId, isSuperAdmin, roleIds }: { adminId: string; isSuperAdmin: boolean; roleIds: number[] }) =>
            api.put<AdminAccess>(`${base}/admins/${adminId}`, { isSuperAdmin, roleIds }).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["access"] });
            qc.invalidateQueries({ queryKey: ["admins"] });
        },
    });
};

// ---------------------------------------------------------------- two-factor

const twoFa = "/api/platform/auth/2fa";

export const useTwoFactor = () => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: myKey });
    return {
        setup: useMutation({ mutationFn: () => api.post<{ secret: string; otpAuthUri: string }>(`${twoFa}/setup`).then((r) => r.data) }),
        enable: useMutation({ mutationFn: (code: string) => api.post(`${twoFa}/enable`, { code }), onSuccess: ok }),
        disable: useMutation({ mutationFn: (code: string) => api.post(`${twoFa}/disable`, { code }), onSuccess: ok }),
        reset: useMutation({
            mutationFn: (adminId: string) => api.post(`${twoFa}/reset/${adminId}`),
            onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
        }),
    };
};

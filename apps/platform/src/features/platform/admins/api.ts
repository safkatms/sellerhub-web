import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";

export type AdminItem = {
    id: string; fullName: string; email: string; status: number; lastLoginAtUtc: string | null; createdAtUtc: string;
    isSuperAdmin: boolean; twoFactorEnabled: boolean; roles: string[] | null;
};
const key = ["admins"] as const;

export const useAdmins = () =>
    useQuery({ queryKey: key, queryFn: () => api.get<AdminItem[]>("/api/platform/admins").then((r) => r.data) });

export const useCreateAdmin = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (b: { fullName: string; email: string; password: string }) =>
            api.post<AdminItem>("/api/platform/admins", b).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
};

export const useToggleAdmin = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
            api.post<AdminItem>(`/api/platform/admins/${id}/${enable ? "enable" : "disable"}`).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
};
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";

export type TenantNote = { id: string; body: string; isPinned: boolean; createdAtUtc: string; createdBy: string | null;
    createdByName: string | null; updatedAtUtc: string | null; rowVersion: string };
export type Tag = { id: number; name: string; color: string | null; tenantCount: number };

const b = "/api/platform";

export const useTenantNotes = (tenantId: string) =>
    useQuery({ queryKey: ["crm", "notes", tenantId], enabled: Boolean(tenantId),
        queryFn: () => api.get<TenantNote[]>(`${b}/tenants/${tenantId}/notes`).then((r) => r.data) });

export const useNoteMutations = (tenantId: string) => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: ["crm", "notes", tenantId] });
    return {
        add: useMutation({
            mutationFn: (body: { body: string; isPinned: boolean }) =>
                api.post<TenantNote>(`${b}/tenants/${tenantId}/notes`, { ...body, rowVersion: null }).then((r) => r.data),
            onSuccess: ok,
        }),
        update: useMutation({
            mutationFn: ({ id, body }: { id: string; body: { body: string; isPinned: boolean; rowVersion: string } }) =>
                api.put<TenantNote>(`${b}/tenants/${tenantId}/notes/${id}`, body).then((r) => r.data),
            onSuccess: ok,
        }),
        remove: useMutation({ mutationFn: (id: string) => api.delete(`${b}/tenants/${tenantId}/notes/${id}`), onSuccess: ok }),
    };
};

export const useTags = () =>
    useQuery({ queryKey: ["crm", "tags"], queryFn: () => api.get<Tag[]>(`${b}/tags`).then((r) => r.data) });

export const useTagMutations = () => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: ["crm"] });
    return {
        save: useMutation({
            mutationFn: ({ id, body }: { id?: number; body: { name: string; color: string | null } }) =>
                (id ? api.put<Tag>(`${b}/tags/${id}`, body) : api.post<Tag>(`${b}/tags`, body)).then((r) => r.data),
            onSuccess: ok,
        }),
        remove: useMutation({ mutationFn: (id: number) => api.delete(`${b}/tags/${id}`), onSuccess: ok }),
    };
};

export const useTenantTags = (tenantId: string) =>
    useQuery({ queryKey: ["crm", "tenant-tags", tenantId], enabled: Boolean(tenantId),
        queryFn: () => api.get<Tag[]>(`${b}/tenants/${tenantId}/tags`).then((r) => r.data) });

export const useSetTenantTags = (tenantId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (tagIds: number[]) => api.put<Tag[]>(`${b}/tenants/${tenantId}/tags`, { tagIds }).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm"] });
            qc.invalidateQueries({ queryKey: ["tenants"] });
        },
    });
};

/** Tailwind-free color for a tag chip: a named color or a hex value. */
export const tagStyle = (color: string | null) =>
    color ? { backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`, borderColor: color, color: "inherit" } : undefined;

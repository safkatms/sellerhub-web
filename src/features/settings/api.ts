import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

export type PlatformSetting = { key: string; value: string; description: string | null; updatedAtUtc: string };

export const useSettings = () =>
    useQuery({ queryKey: ["settings"], queryFn: () => api.get<PlatformSetting[]>("/api/platform/settings").then((r) => r.data) });

export const useUpdateSetting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ key, value }: { key: string; value: string }) =>
            api.put<PlatformSetting>(`/api/platform/settings/${key}`, { value }).then((r) => r.data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Saved"); },
    });
};
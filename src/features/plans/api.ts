import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

export type PlanLimit = { key: string; value: number | null };
export type Plan = {
    id: number; code: string; name: string; description: string | null; sortOrder: number;
    monthlyPrice: number | null; isActive: boolean; limits: PlanLimit[]; rowVersion: string;
};
export type CreatePlanBody = Pick<Plan, "code" | "name" | "description" | "sortOrder" | "monthlyPrice" | "limits">;
export type UpdatePlanBody = Omit<CreatePlanBody, "code"> & { rowVersion: string };

const key = ["plans"] as const;

export const usePlans = () =>
    useQuery({ queryKey: key, queryFn: () => api.get<Plan[]>("/api/platform/plans").then((r) => r.data) });

export const usePlan = (id: number | undefined) =>
    useQuery({
        queryKey: [...key, id],
        enabled: id !== undefined,
        queryFn: () => api.get<Plan>(`/api/platform/plans/${id}`).then((r) => r.data),
    });

export const useCreatePlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (b: CreatePlanBody) => api.post<Plan>("/api/platform/plans", b).then((r) => r.data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success("Plan created"); },
    });
};

export const useUpdatePlan = (id: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (b: UpdatePlanBody) => api.put<Plan>(`/api/platform/plans/${id}`, b).then((r) => r.data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success("Plan saved"); },
    });
};

export const useTogglePlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, active }: { id: number; active: boolean }) =>
            api.post<Plan>(`/api/platform/plans/${id}/${active ? "activate" : "deactivate"}`).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
};
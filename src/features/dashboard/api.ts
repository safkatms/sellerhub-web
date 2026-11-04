import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type Dashboard = {
    totalTenants: number;
    byState: Record<string, number>;
    byPlan: { planId: number; planCode: string; planName: string; tenants: number }[];
    newThisMonth: number;
    expiringWithinDays: number;
    expiringSoon: { id: string; name: string; slug: string; planCode: string; planExpiresAtUtc: string }[];
    recentSignups: { id: string; name: string; slug: string; planCode: string; createdAtUtc: string }[];
};

export const useDashboard = () =>
    useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Dashboard>("/api/platform/dashboard").then((r) => r.data) });
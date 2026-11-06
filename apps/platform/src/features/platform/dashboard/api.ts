import { useQuery } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";

export type ExpiringTenant = { id: string; name: string; slug: string; planCode: string; planExpiresAtUtc: string };
export type RecentSignup = { id: string; name: string; slug: string; planCode: string; createdAtUtc: string };

export type Dashboard = {
    totalTenants: number;
    byState: Record<string, number>;
    byPlan: { planId: number; planCode: string; planName: string; tenants: number }[];
    newThisMonth: number;
    expiringWithinDays: number;
    expiringSoon: ExpiringTenant[];
    recentSignups: RecentSignup[];
};

export const useDashboard = () =>
    useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Dashboard>("/api/platform/dashboard").then((r) => r.data) });
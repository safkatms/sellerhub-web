import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";
import type { Paged, PagedRequest } from "@sellerhub/api-client/types";

export const TicketStatus = { Open: 1, WaitingOnShop: 2, Resolved: 3, Closed: 4 } as const;
export const ticketStatusLabel: Record<number, string> = { 1: "Open", 2: "Waiting on shop", 3: "Resolved", 4: "Closed" };
export const TicketPriority = { Low: 1, Normal: 2, High: 3, Urgent: 4 } as const;
export const priorityLabel: Record<number, string> = { 1: "Low", 2: "Normal", 3: "High", 4: "Urgent" };
export const AuthorType = { ShopUser: 1, PlatformAdmin: 2 } as const;
export const DataRequestKind = { Export: 1, Delete: 2 } as const;
export const dataKindLabel: Record<number, string> = { 1: "Data export", 2: "Account deletion" };
export const DataRequestStatus = { Pending: 1, Processing: 2, Completed: 3, Rejected: 4, Cancelled: 5 } as const;
export const dataStatusLabel: Record<number, string> = { 1: "Pending", 2: "Processing", 3: "Completed", 4: "Rejected", 5: "Cancelled" };
export const JobStatus = { Running: 1, Succeeded: 2, Failed: 3 } as const;
export const jobStatusLabel: Record<number, string> = { 1: "Running", 2: "Succeeded", 3: "Failed" };

export type TicketListItem = {
    id: string; number: string; tenantId: string; tenantName: string; subject: string; category: string | null; priority: number;
    status: number; assignedAdminId: string | null; assignedAdminName: string | null; lastMessageAtUtc: string; createdAtUtc: string;
};
export type TicketMessage = { id: string; authorType: number; authorName: string | null; body: string; isInternal: boolean; createdAtUtc: string };
export type Ticket = Omit<TicketListItem, "lastMessageAtUtc"> & { resolvedAtUtc: string | null; messages: TicketMessage[]; rowVersion: string };
export type DataRequestItem = {
    id: string; tenantId: string; tenantName: string; kind: number; status: number; reason: string | null; requestedByUserId: string | null;
    requestedAtUtc: string; processedBy: string | null; processedAtUtc: string | null; resultUrl: string | null; adminNote: string | null;
    scheduledPurgeAtUtc: string | null; purgedAtUtc: string | null; rowVersion: string;
};
export type JobRun = { id: number; jobName: string; triggerType: string; triggeredBy: string | null; status: number; startedAtUtc: string;
    finishedAtUtc: string | null; itemsProcessed: number; message: string | null };
export type JobInfo = { name: string; description: string; schedule: string; lastRun: JobRun | null };
export type TrendPoint = { date: string; activeShops: number; graceShops: number; expiredShops: number; totalUsers: number;
    mrr: number; smsSent: number; newShops: number };

const b = "/api/platform";

// ---------------------------------------------------------------- support

export type TicketQuery = PagedRequest & { status?: number; tenantId?: string; unassigned?: boolean; assignedAdminId?: string };
/** How often an open conversation checks for new messages (only while the tab is visible). */
const chatPollMs = 5_000;

export const useTickets = (q: TicketQuery) =>
    useQuery({ queryKey: ["support", "list", q], placeholderData: keepPreviousData, refetchInterval: 15_000,
        queryFn: () => api.get<Paged<TicketListItem>>(`${b}/support/tickets`, { params: q }).then((r) => r.data) });

export const useOpenTicketCount = () =>
    useQuery({ queryKey: ["support", "open-count"], refetchInterval: 60_000,
        queryFn: () => api.get<number>(`${b}/support/tickets/open-count`).then((r) => r.data) });

export const useTicket = (id: string | null) =>
    useQuery({ queryKey: ["support", "ticket", id], enabled: Boolean(id), refetchInterval: chatPollMs,
        queryFn: () => api.get<Ticket>(`${b}/support/tickets/${id}`).then((r) => r.data) });

export const useTicketMutations = () => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: ["support"] });
    return {
        reply: useMutation({
            mutationFn: ({ id, body }: { id: string; body: { message: string; isInternal: boolean; status?: number } }) =>
                api.post<Ticket>(`${b}/support/tickets/${id}/reply`, body).then((r) => r.data),
            onSuccess: ok,
        }),
        update: useMutation({
            mutationFn: ({ id, body }: { id: string; body: { status: number; priority: number; assignedAdminId: string | null; rowVersion: string } }) =>
                api.put<Ticket>(`${b}/support/tickets/${id}`, body).then((r) => r.data),
            onSuccess: ok,
        }),
    };
};

// ---------------------------------------------------------------- data requests + jobs + trends

export type DataRequestQuery = PagedRequest & { status?: number; kind?: number };
export const useDataRequests = (q: DataRequestQuery, enabled = true) =>
    useQuery({ queryKey: ["ops", "data-requests", q], enabled, placeholderData: keepPreviousData,
        queryFn: () => api.get<Paged<DataRequestItem>>(`${b}/data-requests`, { params: q }).then((r) => r.data) });

export const useDataRequestMutations = () => {
    const qc = useQueryClient();
    const ok = () => {
        qc.invalidateQueries({ queryKey: ["ops"] });
        qc.invalidateQueries({ queryKey: ["tenants"] });
    };
    return {
        process: useMutation({
            mutationFn: ({ id, body }: { id: string; body: { status: number; resultUrl?: string; adminNote?: string; rowVersion: string } }) =>
                api.post<DataRequestItem>(`${b}/data-requests/${id}/process`, body).then((r) => r.data),
            onSuccess: ok,
        }),
        markPurged: useMutation({ mutationFn: (id: string) => api.post<DataRequestItem>(`${b}/data-requests/${id}/mark-purged`).then((r) => r.data), onSuccess: ok }),
    };
};

export const useJobs = (enabled = true) =>
    useQuery({ queryKey: ["ops", "jobs"], enabled, refetchInterval: 30_000,
        queryFn: () => api.get<JobInfo[]>(`${b}/jobs`).then((r) => r.data) });

export const useJobRuns = (q: PagedRequest & { jobName?: string; status?: number }, enabled = true) =>
    useQuery({ queryKey: ["ops", "runs", q], enabled, placeholderData: keepPreviousData,
        queryFn: () => api.get<Paged<JobRun>>(`${b}/jobs/runs`, { params: q }).then((r) => r.data) });

export const useRunJob = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => api.post<JobRun>(`${b}/jobs/${encodeURIComponent(name)}/run`).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["ops"] }),
    });
};

export const useJobRunDetails = (id: number | null) =>
    useQuery({ queryKey: ["ops", "run-details", id], enabled: id !== null,
        queryFn: () => api.get<string | null>(`${b}/jobs/runs/${id}/details`).then((r) => r.data) });

export const useTrends = (days: number) =>
    useQuery({ queryKey: ["dashboard", "trends", days],
        queryFn: () => api.get<TrendPoint[]>(`${b}/dashboard/trends`, { params: { days } }).then((r) => r.data) });

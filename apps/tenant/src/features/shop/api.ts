import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBaseURL } from "@sellerhub/api-client/client";

// ---------------------------------------------------------------- enums (match the API)

export const PaymentMethod = { BKash: 1, Nagad: 2, Rocket: 3, Bank: 4, Other: 5 } as const;
export const paymentMethodLabel: Record<number, string> = { 1: "bKash", 2: "Nagad", 3: "Rocket", 4: "Bank transfer", 5: "Other" };
export const paymentStatusLabel: Record<number, string> = { 1: "Waiting for review", 2: "Approved", 3: "Rejected", 4: "Cancelled" };
export const invoiceStatusLabel: Record<number, string> = { 1: "Unpaid", 2: "Paid", 3: "Void" };
export const Severity = { Info: 1, Warning: 2, Critical: 3 } as const;
export const TicketStatus = { Open: 1, WaitingOnShop: 2, Resolved: 3, Closed: 4 } as const;
export const ticketStatusLabel: Record<number, string> = { 1: "Open", 2: "Waiting for you", 3: "Resolved", 4: "Closed" };
export const priorityLabel: Record<number, string> = { 1: "Low", 2: "Normal", 3: "High", 4: "Urgent" };
export const DataRequestKind = { Export: 1, Delete: 2 } as const;
export const dataStatusLabel: Record<number, string> = { 1: "Pending", 2: "In progress", 3: "Completed", 4: "Rejected", 5: "Cancelled" };

export const money = (amount: number | null | undefined, currency = "BDT") =>
    amount == null ? "-" : `${currency === "BDT" ? "৳" : `${currency} `}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// ---------------------------------------------------------------- types

export type PlanPrice = { months: number; price: number; currency: string; isActive: boolean };
export type PlanOption = { planId: number; code: string; name: string; description: string | null; prices: PlanPrice[] };
export type BillingOverview = {
    planId: number; planName: string; planExpiresAtUtc: string | null; planState: string; currency: string;
    paymentInstructions: string | null; plans: PlanOption[]
};
export type Quote = {
    planId: number; planName: string; months: number; subtotal: number; discount: number; total: number;
    currency: string; couponCode: string | null; couponError: string | null
};
export type ShopPaymentRequest = {
    id: string; planId: number; planName: string; months: number; amount: number; currency: string;
    method: number; transactionId: string; couponCode: string | null; status: number; reviewNote: string | null;
    invoiceNumber: string | null; createdAtUtc: string
};
export type ShopInvoice = {
    id: string; number: string; planName: string; months: number; subtotal: number; discount: number;
    total: number; currency: string; status: number; issuedAtUtc: string; dueAtUtc: string | null; paidAtUtc: string | null
};
export type SubmitPaymentBody = {
    planId: number; months: number; amount: number; method: number; payerAccount?: string;
    transactionId: string; couponCode?: string; note?: string
};

export type ShopAnnouncement = {
    id: string; title: string; body: string; severity: number; isDismissible: boolean;
    startsAtUtc: string; endsAtUtc: string | null
};

export type TicketListItem = {
    id: string; number: string; subject: string; category: string | null; priority: number; status: number;
    lastMessageAtUtc: string; createdAtUtc: string
};
export type TicketMessage = { id: string; authorType: number; authorName: string | null; body: string; createdAtUtc: string };
export type Ticket = {
    id: string; number: string; subject: string; category: string | null; priority: number; status: number;
    createdAtUtc: string; messages: TicketMessage[]
};

export type DataRequest = {
    id: string; kind: number; status: number; reason: string | null; requestedAtUtc: string;
    processedAtUtc: string | null; resultUrl: string | null; adminNote: string | null; scheduledPurgeAtUtc: string | null
};

export type PlatformStatus = { maintenanceMode: boolean; maintenanceMessage: string | null; signupEnabled: boolean };

// ---------------------------------------------------------------- billing

export const useBillingOverview = () =>
    useQuery({ queryKey: ["billing", "overview"], queryFn: () => api.get<BillingOverview>("/api/billing").then((r) => r.data) });

export const useQuote = () =>
    useMutation({ mutationFn: (b: { planId: number; months: number; couponCode?: string }) => api.post<Quote>("/api/billing/quote", b).then((r) => r.data) });

export const usePaymentRequests = () =>
    useQuery({ queryKey: ["billing", "requests"], queryFn: () => api.get<ShopPaymentRequest[]>("/api/billing/payment-requests").then((r) => r.data) });

export const useInvoices = () =>
    useQuery({ queryKey: ["billing", "invoices"], queryFn: () => api.get<ShopInvoice[]>("/api/billing/invoices").then((r) => r.data) });

export const usePaymentMutations = () => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: ["billing"] });
    return {
        submit: useMutation({ mutationFn: (b: SubmitPaymentBody) => api.post<ShopPaymentRequest>("/api/billing/payment-requests", b).then((r) => r.data), onSuccess: ok }),
        cancel: useMutation({ mutationFn: (id: string) => api.post<ShopPaymentRequest>(`/api/billing/payment-requests/${id}/cancel`).then((r) => r.data), onSuccess: ok }),
    };
};

// ---------------------------------------------------------------- announcements

export const useAnnouncements = () =>
    useQuery({
        queryKey: ["announcements"], refetchInterval: 5 * 60_000,
        queryFn: () => api.get<ShopAnnouncement[]>("/api/shop/announcements").then((r) => r.data)
    });

export const useDismissAnnouncement = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.post(`/api/shop/announcements/${id}/dismiss`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
    });
};

// ---------------------------------------------------------------- support

/** How often an open conversation checks for new messages (only while the tab is visible). */
const chatPollMs = 5_000;

export const useTickets = () =>
    useQuery({
        queryKey: ["support", "list"], refetchInterval: 15_000,
        queryFn: () => api.get<TicketListItem[]>("/api/shop/support/tickets").then((r) => r.data)
    });

export const useTicket = (id: string | null) =>
    useQuery({
        queryKey: ["support", "ticket", id], enabled: Boolean(id), refetchInterval: chatPollMs,
        queryFn: () => api.get<Ticket>(`/api/shop/support/tickets/${id}`).then((r) => r.data)
    });

export const useTicketMutations = () => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: ["support"] });
    return {
        open: useMutation({
            mutationFn: (b: { subject: string; category?: string; priority: number; message: string }) =>
                api.post<Ticket>("/api/shop/support/tickets", b).then((r) => r.data),
            onSuccess: ok,
        }),
        reply: useMutation({
            mutationFn: ({ id, message }: { id: string; message: string }) =>
                api.post<Ticket>(`/api/shop/support/tickets/${id}/reply`, { message }).then((r) => r.data),
            onSuccess: ok,
        }),
        close: useMutation({ mutationFn: (id: string) => api.post<Ticket>(`/api/shop/support/tickets/${id}/close`).then((r) => r.data), onSuccess: ok }),
    };
};

// ---------------------------------------------------------------- data requests

export const useDataRequests = () =>
    useQuery({ queryKey: ["data-requests"], queryFn: () => api.get<DataRequest[]>("/api/shop/data-requests").then((r) => r.data) });

export const useDataRequestMutations = () => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: ["data-requests"] });
    return {
        create: useMutation({
            mutationFn: (b: { kind: number; reason?: string }) => api.post<DataRequest>("/api/shop/data-requests", b).then((r) => r.data),
            onSuccess: ok,
        }),
        cancel: useMutation({ mutationFn: (id: string) => api.post<DataRequest>(`/api/shop/data-requests/${id}/cancel`).then((r) => r.data), onSuccess: ok }),
    };
};

// ---------------------------------------------------------------- public status (no auth)

export const usePlatformStatus = () =>
    useQuery({
        queryKey: ["platform-status"], staleTime: 60_000, refetchInterval: 2 * 60_000,
        queryFn: () => axios.get<PlatformStatus>(`${apiBaseURL}/api/status`).then((r) => r.data)
    });

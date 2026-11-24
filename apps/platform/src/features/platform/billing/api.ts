import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";
import type { Paged, PagedRequest } from "@sellerhub/api-client/types";

export const PaymentMethod = { BKash: 1, Nagad: 2, Rocket: 3, Bank: 4, Other: 5 } as const;
export const paymentMethodLabel: Record<number, string> = { 1: "bKash", 2: "Nagad", 3: "Rocket", 4: "Bank", 5: "Other" };
export const PaymentRequestStatus = { Pending: 1, Approved: 2, Rejected: 3, Cancelled: 4 } as const;
export const paymentStatusLabel: Record<number, string> = { 1: "Pending", 2: "Approved", 3: "Rejected", 4: "Cancelled" };
export const InvoiceStatus = { Unpaid: 1, Paid: 2, Void: 3 } as const;
export const invoiceStatusLabel: Record<number, string> = { 1: "Unpaid", 2: "Paid", 3: "Void" };
export const CouponDiscountType = { Percent: 1, Fixed: 2 } as const;
export const billingMonths = [1, 3, 6, 12] as const;
export type DateRange = { fromUtc?: string; toUtc?: string };

export const money = (amount: number | null | undefined, currency = "BDT") =>
    amount == null ? "-" : `${currency === "BDT" ? "৳" : `${currency} `}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// ---------------------------------------------------------------- types

export type PlanPrice = { months: number; price: number; currency: string; isActive: boolean };
export type Coupon = {
    id: string; code: string; description: string | null; discountType: number; discountValue: number;
    maxRedemptions: number | null; maxPerTenant: number | null; redeemedCount: number; planId: number | null;
    validFromUtc: string | null; validToUtc: string | null; isActive: boolean; createdAtUtc: string; rowVersion: string;
};
export type SaveCouponBody = Omit<Coupon, "id" | "redeemedCount" | "createdAtUtc" | "rowVersion"> & { rowVersion: string | null };
export type Quote = {
    planId: number; planName: string; months: number; subtotal: number; discount: number; total: number;
    currency: string; couponCode: string | null; couponError: string | null
};
export type Invoice = {
    id: string; number: string; tenantId: string; tenantName: string; planId: number; planName: string; months: number;
    subtotal: number; discount: number; total: number; currency: string; status: number; couponId: string | null;
    subscriptionId: string | null; paymentReference: string | null; notes: string | null; issuedAtUtc: string;
    dueAtUtc: string | null; paidAtUtc: string | null; voidedAtUtc: string | null; voidReason: string | null; rowVersion: string;
};
export type PaymentRequestItem = {
    id: string; tenantId: string; tenantName: string; planId: number; planName: string; months: number; amount: number;
    expectedTotal: number | null; currency: string; method: number; payerAccount: string | null; transactionId: string;
    couponCode: string | null; note: string | null; status: number; reviewedBy: string | null; reviewedAtUtc: string | null;
    reviewNote: string | null; invoiceId: string | null; invoiceNumber: string | null; createdAtUtc: string; rowVersion: string;
};
export type TenantCredit = {
    id: string; days: number; reason: string; previousExpiresAtUtc: string | null; newExpiresAtUtc: string;
    createdAtUtc: string; createdBy: string | null
};
export type BillingSummary = { pendingPaymentRequests: number; unpaidInvoices: number; paidThisMonth: number; currency: string };

const b = "/api/platform";
const key = ["billing"] as const;
const useInvalidate = () => {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: key });
        qc.invalidateQueries({ queryKey: ["tenants"] }); // expiry / plan changed
    };
};

// ---------------------------------------------------------------- hooks

export const useBillingSummary = (range: DateRange = {}) =>
    useQuery({
        queryKey: [...key, "summary", range], placeholderData: keepPreviousData,
        queryFn: () => api.get<BillingSummary>(`${b}/billing/summary`, { params: range }).then((r) => r.data)
    });

export const usePlanPrices = (planId: number | undefined) =>
    useQuery({
        queryKey: [...key, "prices", planId], enabled: planId !== undefined,
        queryFn: () => api.get<PlanPrice[]>(`${b}/plans/${planId}/prices`).then((r) => r.data)
    });

export const useSetPlanPrices = (planId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (prices: PlanPrice[]) => api.put<PlanPrice[]>(`${b}/plans/${planId}/prices`, { prices }).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...key, "prices", planId] });
            qc.invalidateQueries({ queryKey: ["plans"] });
        },
    });
};

export const useCoupons = () =>
    useQuery({ queryKey: [...key, "coupons"], queryFn: () => api.get<Coupon[]>(`${b}/billing/coupons`).then((r) => r.data) });

export const useCouponMutations = () => {
    const done = useInvalidate();
    return {
        save: useMutation({
            mutationFn: ({ id, body }: { id?: string; body: SaveCouponBody }) =>
                (id ? api.put<Coupon>(`${b}/billing/coupons/${id}`, body) : api.post<Coupon>(`${b}/billing/coupons`, body)).then((r) => r.data),
            onSuccess: done,
        }),
        remove: useMutation({ mutationFn: (id: string) => api.delete(`${b}/billing/coupons/${id}`), onSuccess: done }),
    };
};

export type InvoiceQuery = PagedRequest & { tenantId?: string; status?: number } & DateRange;
export const useInvoices = (q: InvoiceQuery) =>
    useQuery({
        queryKey: [...key, "invoices", q], placeholderData: keepPreviousData,
        queryFn: () => api.get<Paged<Invoice>>(`${b}/billing/invoices`, { params: q }).then((r) => r.data)
    });

export const useInvoiceMutations = () => {
    const done = useInvalidate();
    return {
        create: useMutation({
            mutationFn: ({ tenantId, body }: { tenantId: string; body: { planId: number; months: number; couponCode?: string; notes?: string } }) =>
                api.post<Invoice>(`${b}/tenants/${tenantId}/invoices`, body).then((r) => r.data),
            onSuccess: done,
        }),
        markPaid: useMutation({
            mutationFn: ({ id, body }: { id: string; body: { paymentReference?: string; notes?: string; rowVersion: string } }) =>
                api.post<Invoice>(`${b}/billing/invoices/${id}/mark-paid`, body).then((r) => r.data),
            onSuccess: done,
        }),
        void: useMutation({
            mutationFn: ({ id, body }: { id: string; body: { reason: string; rowVersion: string } }) =>
                api.post<Invoice>(`${b}/billing/invoices/${id}/void`, body).then((r) => r.data),
            onSuccess: done,
        }),
    };
};

export type PaymentRequestQuery = PagedRequest & { tenantId?: string; status?: number };
export const usePaymentRequests = (q: PaymentRequestQuery) =>
    useQuery({
        queryKey: [...key, "requests", q], placeholderData: keepPreviousData,
        queryFn: () => api.get<Paged<PaymentRequestItem>>(`${b}/billing/payment-requests`, { params: q }).then((r) => r.data)
    });

export const useReviewPayment = () => {
    const done = useInvalidate();
    return useMutation({
        mutationFn: ({ id, approve, note, rowVersion }: { id: string; approve: boolean; note?: string; rowVersion: string }) =>
            api.post<PaymentRequestItem>(`${b}/billing/payment-requests/${id}/${approve ? "approve" : "reject"}`, { note, rowVersion })
                .then((r) => r.data),
        onSuccess: done,
    });
};

export const useQuote = () =>
    useMutation({
        mutationFn: ({ tenantId, body }: { tenantId: string; body: { planId: number; months: number; couponCode?: string } }) =>
            api.post<Quote>(`${b}/tenants/${tenantId}/quote`, body).then((r) => r.data),
    });

export const useCredits = (tenantId: string) =>
    useQuery({
        queryKey: [...key, "credits", tenantId], enabled: Boolean(tenantId),
        queryFn: () => api.get<TenantCredit[]>(`${b}/tenants/${tenantId}/credits`).then((r) => r.data)
    });

export const useGrantCredit = (tenantId: string) => {
    const done = useInvalidate();
    return useMutation({
        mutationFn: (body: { days: number; reason: string }) => api.post<TenantCredit>(`${b}/tenants/${tenantId}/credits`, body).then((r) => r.data),
        onSuccess: done,
    });
};

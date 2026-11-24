import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";
import { toListParams, type ListRequest } from "@sellerhub/api-client/query";
import type { Paged } from "@sellerhub/api-client/types";

export const Channel = { Email: 1, Sms: 2 } as const;
export const channelLabel: Record<number, string> = { 1: "Email", 2: "SMS" };
export const MessageStatus = {
  Queued: 1,
  Sending: 2,
  Sent: 3,
  Failed: 4,
  Cancelled: 5,
} as const;
export const messageStatusLabel: Record<number, string> = {
  1: "Queued",
  2: "Sending",
  3: "Sent",
  4: "Failed",
  5: "Cancelled",
};

export type Template = {
  id: number;
  code: string;
  channel: number;
  language: string;
  subject: string | null;
  body: string;
  description: string | null;
  isActive: boolean;
  updatedAtUtc: string | null;
  rowVersion: string;
};

export type OutboundMessage = {
  id: number;
  tenantId: string | null;
  tenantName: string | null;
  channel: number;
  recipient: string;
  templateCode: string | null;
  subject: string | null;
  body: string;
  status: number;
  attemptCount: number;
  nextAttemptAtUtc: string;
  provider: string | null;
  providerMessageId: string | null;
  cost: number | null;
  error: string | null;
  createdAtUtc: string;
  sentAtUtc: string | null;
};

export type MessageUsage = {
  tenantId: string | null;
  tenantName: string | null;
  smsSent: number;
  emailSent: number;
  failed: number;
  cost: number;
};

const b = "/api/platform";

export const useTemplates = () =>
  useQuery({
    queryKey: ["notifications", "templates"],
    queryFn: () =>
      api.get<Template[]>(`${b}/notifications/templates`).then((r) => r.data),
  });

export const useTemplateMutations = () => {
  const qc = useQueryClient();
  const ok = () =>
    qc.invalidateQueries({ queryKey: ["notifications", "templates"] });
  return {
    create: useMutation({
      mutationFn: (body: {
        code: string;
        channel: number;
        language: string;
        subject: string | null;
        body: string;
        description: string | null;
      }) =>
        api
          .post<Template>(`${b}/notifications/templates`, body)
          .then((r) => r.data),
      onSuccess: ok,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        body,
      }: {
        id: number;
        body: {
          subject: string | null;
          body: string;
          isActive: boolean;
          rowVersion: string;
        };
      }) =>
        api
          .put<Template>(`${b}/notifications/templates/${id}`, body)
          .then((r) => r.data),
      onSuccess: ok,
    }),
  };
};

/** Filters: tenantId, channel, status, createdAtUtc, sentAtUtc. Search: recipient, template code. */
export const useMessages = (q: ListRequest, enabled = true) =>
  useQuery({
    queryKey: ["notifications", "messages", q],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () =>
      api
        .get<Paged<OutboundMessage>>(`${b}/notifications/messages`, {
          params: toListParams(q),
        })
        .then((r) => r.data),
  });

export const useMessageMutations = () => {
  const qc = useQueryClient();
  const ok = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  return {
    retry: useMutation({
      mutationFn: (id: number) =>
        api
          .post<OutboundMessage>(`${b}/notifications/messages/${id}/retry`)
          .then((r) => r.data),
      onSuccess: ok,
    }),
    cancel: useMutation({
      mutationFn: (id: number) =>
        api
          .post<OutboundMessage>(`${b}/notifications/messages/${id}/cancel`)
          .then((r) => r.data),
      onSuccess: ok,
    }),
    test: useMutation({
      mutationFn: (body: {
        channel: number;
        recipient: string;
        subject: string | null;
        body: string;
      }) =>
        api
          .post<OutboundMessage>(`${b}/notifications/test`, body)
          .then((r) => r.data),
      onSuccess: ok,
    }),
  };
};

export const useMessageUsage = (days: number, enabled = true) =>
  useQuery({
    queryKey: ["notifications", "usage", days],
    enabled,
    queryFn: () =>
      api
        .get<MessageUsage[]>(`${b}/notifications/usage`, {
          params: { from: new Date(Date.now() - days * 86_400_000).toISOString() },
        })
        .then((r) => r.data),
  });
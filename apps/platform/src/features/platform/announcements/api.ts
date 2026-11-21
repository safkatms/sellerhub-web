import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@sellerhub/api-client/client";

export const Severity = { Info: 1, Warning: 2, Critical: 3 } as const;
export const severityLabel: Record<number, string> = {
  1: "Info",
  2: "Warning",
  3: "Critical",
};
export const Target = { All: 1, Plan: 2, Tenant: 3 } as const;

export type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: number;
  targetType: number;
  targetPlanId: number | null;
  targetPlanName: string | null;
  targetTenantId: string | null;
  targetTenantName: string | null;
  startsAtUtc: string;
  endsAtUtc: string | null;
  isDismissible: boolean;
  isActive: boolean;
  isLive: boolean;
  dismissCount: number;
  createdAtUtc: string;
  rowVersion: string;
};

export type SaveAnnouncementBody = {
  title: string;
  body: string;
  severity: number;
  targetType: number;
  targetPlanId: number | null;
  targetTenantId: string | null;
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  isDismissible: boolean;
  isActive: boolean;
  rowVersion: string | null;
};

const b = "/api/platform";

export const useAnnouncements = () =>
  useQuery({
    queryKey: ["announcements"],
    queryFn: () =>
      api.get<Announcement[]>(`${b}/announcements`).then((r) => r.data),
  });

export const useAnnouncementMutations = () => {
  const qc = useQueryClient();
  const ok = () => qc.invalidateQueries({ queryKey: ["announcements"] });
  return {
    save: useMutation({
      mutationFn: ({ id, body }: { id?: string; body: SaveAnnouncementBody }) =>
        (id
          ? api.put<Announcement>(`${b}/announcements/${id}`, body)
          : api.post<Announcement>(`${b}/announcements`, body)
        ).then((r) => r.data),
      onSuccess: ok,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`${b}/announcements/${id}`),
      onSuccess: ok,
    }),
  };
};
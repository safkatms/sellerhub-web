"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CircleCheck, Mail } from "lucide-react";
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import {
  channelLabel,
  messageStatusLabel,
  useMessageMutations,
  useMessages,
} from "./api";
import { messageColumns } from "./columns";
import { TestMessageDialog } from "./test-message-dialog";

const defs: FilterDef[] = [
  { key: "range", field: "createdAtUtc", type: "date-range" },
  {
    key: "status",
    type: "select",
    allLabel: "All statuses",
    options: Object.entries(messageStatusLabel).map(([value, label]) => ({
      value,
      label,
    })),
    icon: CircleCheck,
  },
  {
    key: "channel",
    type: "select",
    allLabel: "Email + SMS",
    options: Object.entries(channelLabel).map(([value, label]) => ({
      value,
      label,
    })),
    icon: Mail,
  },
  {
    key: "search",
    type: "search",
    placeholder: "Search recipient or template…",
  },
];

export function MessagesPage() {
  const can = useCan();
  const editable = can(Perm.NotificationManage);
  const list = useServerList({ defs });
  const { data, isLoading } = useMessages(list.request);
  const m = useMessageMutations();
  const [testOpen, setTestOpen] = useState(false);

  const columns = messageColumns(editable, {
    retry: (id) =>
      m.retry.mutate(id, {
        onSuccess: () => toast.success("Queued again"),
        onError: (e) => applyProblem(e),
      }),
    cancel: (id) => m.cancel.mutate(id, { onError: (e) => applyProblem(e) }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-2">
        <Filters filters={list.filters} className="flex-1" />
        {editable && (
          <Button variant="outline" onClick={() => setTestOpen(true)}>
            Send test
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
      />

      <TestMessageDialog open={testOpen} onClose={() => setTestOpen(false)} />
    </div>
  );
}

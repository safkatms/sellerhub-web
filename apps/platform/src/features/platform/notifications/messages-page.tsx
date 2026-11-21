"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import { Input } from "@sellerhub/ui/components/input";
import { DataTable } from "@sellerhub/ui/data-table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import {
  Channel,
  messageStatusLabel,
  useMessageMutations,
  useMessages,
} from "./api";
import { messageColumns } from "./columns";
import { TestMessageDialog } from "./test-message-dialog";

const select = "h-9 rounded-md border bg-background px-2 text-sm";
const pageSize = 20;

export function MessagesPage() {
  const can = useCan();
  const editable = can(Perm.NotificationManage);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<number | undefined>();
  const [channel, setChannel] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useMessages({
    page,
    pageSize,
    status,
    channel,
    search: search || undefined,
  });
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
      <div className="flex flex-wrap gap-2">
        <select
          className={select}
          value={status ?? ""}
          onChange={(e) => {
            setStatus(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {Object.entries(messageStatusLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className={select}
          value={channel ?? ""}
          onChange={(e) => {
            setChannel(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
        >
          <option value="">Email + SMS</option>
          <option value={Channel.Email}>Email</option>
          <option value={Channel.Sms}>SMS</option>
        </select>
        <Input
          className="max-w-xs"
          placeholder="Search recipient or template…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {editable && (
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => setTestOpen(true)}
          >
            Send test
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        sorting={[]}
        onPageChange={setPage}
        onSortingChange={() => {}}
      />

      <TestMessageDialog open={testOpen} onClose={() => setTestOpen(false)} />
    </div>
  );
}

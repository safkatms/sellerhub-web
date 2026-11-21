"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sellerhub/ui/components/tabs";
import { DataTable } from "@sellerhub/ui/data-table";
import {
  useLocalTable,
  type SortAccessors,
} from "@sellerhub/ui/hooks/use-local-table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import { money } from "@/features/platform/billing/api";
import {
  Channel,
  messageStatusLabel,
  channelLabel,
  useMessageMutations,
  useMessageUsage,
  useMessages,
  useTemplates,
  type Template,
} from "./api";
import {
  messageColumns,
  templateColumns,
  usageColumns,
  type UsageRow,
} from "./columns";

const select = "h-9 rounded-md border bg-background px-2 text-sm";
const pageSize = 20;

export function NotificationsPage() {
  const [tab, setTab] = useState("messages");
  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(String(v))}
      className="space-y-4"
    >
      <TabsList variant="line">
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="usage">SMS usage</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>
      <TabsContent value="messages">
        <MessagesTab />
      </TabsContent>
      <TabsContent value="usage">
        <UsageTab enabled={tab === "usage"} />
      </TabsContent>
      <TabsContent value="templates">
        <TemplatesTab />
      </TabsContent>
    </Tabs>
  );
}

function MessagesTab() {
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

function TestMessageDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const m = useMessageMutations();
  const [t, setT] = useState({
    channel: Channel.Sms as number,
    recipient: "",
    subject: "",
    body: "SellerHub test message",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a test message</DialogTitle>
          <DialogDescription>
            Queued like any other message; the dispatcher sends it within a
            minute.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <select
            className={`${select} w-full`}
            value={t.channel}
            onChange={(e) => setT({ ...t, channel: Number(e.target.value) })}
          >
            <option value={Channel.Sms}>SMS</option>
            <option value={Channel.Email}>Email</option>
          </select>
          <Input
            placeholder={
              t.channel === Channel.Sms ? "+8801XXXXXXXXX" : "name@example.com"
            }
            value={t.recipient}
            onChange={(e) => setT({ ...t, recipient: e.target.value })}
          />
          {t.channel === Channel.Email && (
            <Input
              placeholder="Subject"
              value={t.subject}
              onChange={(e) => setT({ ...t, subject: e.target.value })}
            />
          )}
          <textarea
            className="min-h-20 w-full rounded-md border bg-background p-2 text-sm"
            value={t.body}
            onChange={(e) => setT({ ...t, body: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!t.recipient.trim() || !t.body.trim() || m.test.isPending}
            onClick={() =>
              m.test.mutate(
                {
                  channel: t.channel,
                  recipient: t.recipient.trim(),
                  subject: t.subject.trim() || null,
                  body: t.body.trim(),
                },
                {
                  onSuccess: () => {
                    toast.success("Queued");
                    onClose();
                  },
                  onError: (e) => applyProblem(e),
                },
              )
            }
          >
            Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const usageSort: SortAccessors<UsageRow> = {
  shop: (r) => r.tenantName ?? "",
  smsSent: (r) => r.smsSent,
  emailSent: (r) => r.emailSent,
  failed: (r) => r.failed,
  cost: (r) => r.cost,
};

function UsageTab({ enabled }: { enabled: boolean }) {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useMessageUsage(days, enabled);
  const table = useLocalTable(data, {
    sortBy: usageSort,
    initialSorting: [{ id: "cost", desc: true }],
  });
  const total = (data ?? []).reduce((s, r) => s + r.cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          SMS and email per shop
          <select
            className={select}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[7, 30, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cost uses the provider&apos;s price, or the SmsCostPerMessage setting.
          Total {money(total)}.
        </p>
      </CardHeader>
      <CardContent>
        <DataTable columns={usageColumns} loading={isLoading} {...table} />
      </CardContent>
    </Card>
  );
}

const templateSort: SortAccessors<Template> = {
  code: (t) => t.code,
  channel: (t) => channelLabel[t.channel],
  language: (t) => t.language,
  status: (t) => (t.isActive ? 1 : 0),
};

function TemplatesTab() {
  const can = useCan();
  const { data, isLoading } = useTemplates();
  const table = useLocalTable(data, {
    sortBy: templateSort,
    initialSorting: [{ id: "code", desc: false }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {
            "Use {{Placeholder}} tokens; each template lists the ones it gets. A shop gets its own language, else English."
          }
        </p>
        {can(Perm.NotificationManage) && (
          <Button
            nativeButton={false}
            render={<Link href="/platform/notifications/templates/new" />}
          >
            New template
          </Button>
        )}
      </div>
      <DataTable columns={templateColumns} loading={isLoading} {...table} />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sellerhub/ui/components/tabs";
import { DataTable } from "@sellerhub/ui/data-table";
import { MessagesPage } from "./messages-page";
import {
  useLocalTable,
  type SortAccessors,
} from "@sellerhub/ui/hooks/use-local-table";
import { Perm, useCan } from "@/features/platform/roles/api";
import { money } from "@/features/platform/billing/api";
import {
  channelLabel,
  useMessageUsage,
  useTemplates,
  type Template,
} from "./api";
import {
  templateColumns,
  usageColumns,
  type UsageRow,
} from "./columns";

const select = "h-9 rounded-md border bg-background px-2 text-sm";

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
        <MessagesPage />
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

import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import { money } from "@/features/platform/billing/api";
import {
  MessageStatus,
  channelLabel,
  messageStatusLabel,
  type Template,
  type useMessages,
  type useMessageUsage,
} from "./api";

export type Message = NonNullable<
  ReturnType<typeof useMessages>["data"]
>["items"][number];
export type UsageRow = NonNullable<
  ReturnType<typeof useMessageUsage>["data"]
>[number];

export const messageColumns = (
  editable: boolean,
  actions: {
    retry: (id: Message["id"]) => void;
    cancel: (id: Message["id"]) => void;
  },
): AppColumnDef<Message>[] => [
  {
    id: "createdAtUtc",
    header: "Created",
    accessorKey: "createdAtUtc",
    cell: ({ row }) => (
      <span className="text-xs">{fmtDate(row.original.createdAtUtc)}</span>
    ),
  },
  {
    id: "recipient",
    header: "To",
    accessorKey: "recipient",
    enableSorting: false,
    cell: ({ row }) => (
      <>
        <Badge variant="outline">{channelLabel[row.original.channel]}</Badge>{" "}
        {row.original.recipient}
      </>
    ),
  },
  {
    id: "shop",
    header: "Shop",
    accessorKey: "tenantName",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.tenantId ? (
        <Link
          className="underline"
          href={`/platform/tenants/${row.original.tenantId}`}
        >
          {row.original.tenantName ?? "Shop"}
        </Link>
      ) : (
        "-"
      ),
  },
  {
    id: "message",
    header: "Message",
    accessorKey: "body",
    enableSorting: false,
    cell: ({ row }) => {
      const x = row.original;
      return (
        <div>
          <div className="text-xs text-muted-foreground">{x.templateCode}</div>
          <div className="max-w-md truncate text-sm" title={x.body}>
            {x.subject ? `${x.subject}: ` : ""}
            {x.body}
          </div>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    enableSorting: false,
    cell: ({ row }) => {
      const x = row.original;
      return (
        <div>
          <Badge
            variant={
              x.status === MessageStatus.Sent
                ? "default"
                : x.status === MessageStatus.Failed
                  ? "destructive"
                  : "secondary"
            }
          >
            {messageStatusLabel[x.status]}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {x.attemptCount} attempt(s)
            {x.status === MessageStatus.Queued && x.attemptCount > 0
              ? `, next ${fmtDate(x.nextAttemptAtUtc)}`
              : ""}
          </div>
          {x.error && (
            <div
              className="max-w-56 truncate text-xs text-destructive"
              title={x.error}
            >
              {x.error}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const x = row.original;
      if (!editable) return null;
      return (
        <div className="flex justify-end">
          {(x.status === MessageStatus.Failed ||
            x.status === MessageStatus.Cancelled) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.retry(x.id)}
            >
              Retry
            </Button>
          )}
          {x.status === MessageStatus.Queued && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.cancel(x.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      );
    },
  },
];

export const usageColumns: AppColumnDef<UsageRow>[] = [
  {
    id: "shop",
    header: "Shop",
    accessorKey: "tenantName",
    cell: ({ row }) =>
      row.original.tenantId ? (
        <Link
          className="underline"
          href={`/platform/tenants/${row.original.tenantId}`}
        >
          {row.original.tenantName ?? row.original.tenantId}
        </Link>
      ) : (
        "Platform (tests)"
      ),
  },
  { id: "smsSent", header: "SMS sent", accessorKey: "smsSent" },
  { id: "emailSent", header: "Email sent", accessorKey: "emailSent" },
  { id: "failed", header: "Failed", accessorKey: "failed" },
  {
    id: "cost",
    header: "Cost",
    accessorKey: "cost",
    cell: ({ row }) => money(row.original.cost),
  },
];

export const templateColumns: AppColumnDef<Template>[] = [
  {
    id: "code",
    header: "Code",
    accessorKey: "code",
    cell: ({ row }) => (
      <div>
        <Link
          className="font-mono text-xs underline"
          href={`/platform/notifications/templates/${row.original.id}`}
        >
          {row.original.code}
        </Link>
        {row.original.description && (
          <div className="text-xs text-muted-foreground">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "channel",
    header: "Channel",
    accessorKey: "channel",
    cell: ({ row }) => channelLabel[row.original.channel],
  },
  { id: "language", header: "Lang", accessorKey: "language" },
  {
    id: "text",
    header: "Text",
    accessorKey: "body",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="max-w-md truncate text-sm" title={row.original.body}>
        {row.original.subject ? <b>{row.original.subject} · </b> : null}
        {row.original.body}
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "isActive",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "outline"}>
        {row.original.isActive ? "On" : "Off"}
      </Badge>
    ),
  },
];

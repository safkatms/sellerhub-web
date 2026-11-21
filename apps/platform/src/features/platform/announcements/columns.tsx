import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import {
  Severity,
  Target,
  severityLabel,
  type Announcement,
} from "./api";

export const audienceOf = (a: Announcement) =>
  a.targetType === Target.All
    ? "All shops"
    : a.targetType === Target.Plan
      ? `Plan: ${a.targetPlanName}`
      : `Shop: ${a.targetTenantName}`;

export const statusOf = (a: Announcement) =>
  a.isLive ? "Live" : a.isActive ? "Scheduled / ended" : "Off";

export const announcementColumns: AppColumnDef<Announcement>[] = [
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
    cell: ({ row }) => {
      const a = row.original;
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                a.severity === Severity.Critical
                  ? "destructive"
                  : a.severity === Severity.Warning
                    ? "secondary"
                    : "outline"
              }
            >
              {severityLabel[a.severity]}
            </Badge>
            <Link
              className="font-medium underline"
              href={`/platform/announcements/${a.id}`}
            >
              {a.title}
            </Link>
          </div>
          <div className="max-w-md truncate text-xs text-muted-foreground">
            {a.body}
          </div>
        </div>
      );
    },
  },
  {
    id: "audience",
    header: "Audience",
    accessorKey: "targetType",
    cell: ({ row }) => audienceOf(row.original),
  },
  {
    id: "startsAtUtc",
    header: "When",
    accessorKey: "startsAtUtc",
    cell: ({ row }) => (
      <span className="text-xs">
        {fmtDate(row.original.startsAtUtc)} →{" "}
        {row.original.endsAtUtc ? fmtDate(row.original.endsAtUtc) : "no end"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "isLive",
    cell: ({ row }) => (
      <Badge variant={row.original.isLive ? "default" : "outline"}>
        {statusOf(row.original)}
      </Badge>
    ),
  },
  {
    id: "dismissCount",
    header: "Dismissed",
    accessorKey: "dismissCount",
    cell: ({ row }) =>
      row.original.isDismissible
        ? row.original.dismissCount
        : "Not dismissible",
  },
];

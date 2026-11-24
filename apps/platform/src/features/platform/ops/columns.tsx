import Link from "next/link";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import {
  DataRequestKind,
  DataRequestStatus,
  JobStatus,
  dataKindLabel,
  dataStatusLabel,
  jobStatusLabel,
  type DataRequestItem,
  type useJobRuns,
} from "./api";

export type JobRun = NonNullable<
  ReturnType<typeof useJobRuns>["data"]
>["items"][number];

const purgeDue = (r: DataRequestItem) =>
  r.scheduledPurgeAtUtc &&
  !r.purgedAtUtc &&
  new Date(r.scheduledPurgeAtUtc) <= new Date();

export const dataRequestColumns = (
  editable: boolean,
  actions: {
    onProcess: (item: DataRequestItem, status: number) => void;
    onPurge: (item: DataRequestItem) => void;
  },
): AppColumnDef<DataRequestItem>[] => [
  {
    id: "requestedAtUtc",
    header: "Requested",
    accessorKey: "requestedAtUtc",
    cell: ({ row }) => (
      <span className="text-xs">{fmtDate(row.original.requestedAtUtc)}</span>
    ),
  },
  {
    id: "shop",
    header: "Shop",
    accessorKey: "tenantName",
    enableSorting: false,
    cell: ({ row }) => (
      <div>
        <Link
          className="underline"
          href={`/platform/tenants/${row.original.tenantId}`}
        >
          {row.original.tenantName}
        </Link>
        {row.original.reason && (
          <div
            className="max-w-56 truncate text-xs text-muted-foreground"
            title={row.original.reason}
          >
            “{row.original.reason}”
          </div>
        )}
      </div>
    ),
  },
  {
    id: "kind",
    header: "Kind",
    accessorKey: "kind",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.kind === DataRequestKind.Delete
            ? "destructive"
            : "outline"
        }
      >
        {dataKindLabel[row.original.kind]}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    enableSorting: false,
    cell: ({ row }) => (
      <div>
        <Badge variant="secondary">
          {dataStatusLabel[row.original.status]}
        </Badge>
        {row.original.adminNote && (
          <div
            className="max-w-48 truncate text-xs text-muted-foreground"
            title={row.original.adminNote}
          >
            {row.original.adminNote}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "result",
    header: "Result",
    accessorKey: "resultUrl",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="text-xs">
          {r.resultUrl && (
            <a
              className="underline"
              href={r.resultUrl}
              target="_blank"
              rel="noreferrer"
            >
              Download link
            </a>
          )}
          {r.scheduledPurgeAtUtc && (
            <div>Purge after {fmtDate(r.scheduledPurgeAtUtc)}</div>
          )}
          {r.purgedAtUtc && <div>Purged {fmtDate(r.purgedAtUtc)}</div>}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      if (!editable) return null;
      const open =
        r.status === DataRequestStatus.Pending ||
        r.status === DataRequestStatus.Processing;
      return (
        <div className="flex justify-end gap-2">
          {open && r.status === DataRequestStatus.Pending && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.onProcess(r, DataRequestStatus.Processing)}
            >
              Start
            </Button>
          )}
          {open && (
            <>
              <Button
                size="sm"
                onClick={() =>
                  actions.onProcess(r, DataRequestStatus.Completed)
                }
              >
                {r.kind === DataRequestKind.Delete ? "Approve" : "Complete"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => actions.onProcess(r, DataRequestStatus.Rejected)}
              >
                Reject
              </Button>
            </>
          )}
          {purgeDue(r) && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => actions.onPurge(r)}
            >
              Mark purged
            </Button>
          )}
        </div>
      );
    },
  },
];

export const jobRunColumns = (
  canOps: boolean,
  onDetails: (id: number) => void,
): AppColumnDef<JobRun>[] => [
  {
    id: "startedAtUtc",
    header: "Started",
    accessorKey: "startedAtUtc",
    cell: ({ row }) => (
      <span className="text-xs">{fmtDate(row.original.startedAtUtc)}</span>
    ),
  },
  {
    id: "job",
    header: "Job",
    accessorKey: "jobName",
    enableSorting: false,
    cell: ({ row }) => <code className="text-xs">{row.original.jobName}</code>,
  },
  {
    id: "trigger",
    header: "Trigger",
    accessorKey: "triggerType",
    enableSorting: false,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      if (r.status === JobStatus.Failed && canOps)
        return (
          <button
            type="button"
            className="underline"
            onClick={() => onDetails(r.id)}
          >
            <Badge variant="destructive">Failed</Badge>
          </button>
        );
      return (
        <Badge
          variant={r.status === JobStatus.Succeeded ? "default" : "secondary"}
        >
          {jobStatusLabel[r.status]}
        </Badge>
      );
    },
  },
  {
    id: "items",
    header: "Items",
    accessorKey: "itemsProcessed",
    enableSorting: false,
  },
  {
    id: "message",
    header: "Message",
    accessorKey: "message",
    enableSorting: false,
    cell: ({ row }) => (
      <div
        className="max-w-md truncate text-xs"
        title={row.original.message ?? ""}
      >
        {row.original.message}
      </div>
    ),
  },
];

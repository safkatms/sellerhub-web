import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/dayjs";
import type { AppColumnDef } from "@/lib/table";
import type { AuditLog, ErrorLog, LoginLog } from "./api";

const clip = (value: string | null, length = 60) =>
  value
    ? value.length > length
      ? `${value.slice(0, length)}…`
      : value
    : "-";

const dateColumn = <T extends { createdAtUtc: string }>(): AppColumnDef<T> => ({
  id: "createdAtUtc",
  header: "Time",
  accessorKey: "createdAtUtc",
  enableSorting: false,
  cell: ({ getValue }) => fmtDate(getValue<string>()),
});

export const auditColumns = (
  onSelect: (log: AuditLog) => void,
): AppColumnDef<AuditLog>[] => [
    dateColumn<AuditLog>(),
    {
      id: "action",
      header: "Action",
      accessorKey: "action",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          className="underline"
          onClick={() => onSelect(row.original)}
        >
          {row.original.action}
        </button>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      enableSorting: false,
      accessorFn: (row) =>
        row.entityName ? `${row.entityName} ${row.entityId ?? ""}` : "-",
    },
    {
      id: "new",
      header: "New values",
      accessorKey: "newValues",
      enableSorting: false,
      cell: ({ getValue }) => (
        <code className="text-xs">{clip(getValue<string | null>())}</code>
      ),
    },
    { id: "ip", header: "IP", accessorKey: "ipAddress", enableSorting: false },
    {
      id: "correlation",
      header: "Correlation",
      accessorKey: "correlationId",
      enableSorting: false,
    },
  ];

export const loginColumns = (
  onSelect: (log: LoginLog) => void,
): AppColumnDef<LoginLog>[] => [
    dateColumn<LoginLog>(),
    {
      id: "identifier",
      header: "Identifier",
      accessorKey: "identifier",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          className="underline"
          onClick={() => onSelect(row.original)}
        >
          {row.original.identifier}
        </button>
      ),
    },
    {
      id: "ok",
      header: "Result",
      accessorKey: "isSuccess",
      enableSorting: false,
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge>Success</Badge>
        ) : (
          <Badge variant="destructive">Failed</Badge>
        ),
    },
    {
      id: "reason",
      header: "Reason",
      accessorKey: "failureReason",
      enableSorting: false,
    },
    { id: "ip", header: "IP", accessorKey: "ipAddress", enableSorting: false },
    {
      id: "userAgent",
      header: "User agent",
      accessorKey: "userAgent",
      enableSorting: false,
      cell: ({ getValue }) => clip(getValue<string | null>(), 50),
    },
    {
      id: "correlation",
      header: "Correlation",
      accessorKey: "correlationId",
      enableSorting: false,
    },
  ];

export const errorColumns = (
  onSelect: (id: number) => void,
): AppColumnDef<ErrorLog>[] => [
    dateColumn<ErrorLog>(),
    {
      id: "status",
      header: "Status",
      accessorKey: "statusCode",
      enableSorting: false,
    },
    {
      id: "req",
      header: "Request",
      enableSorting: false,
      accessorFn: (row) => `${row.httpMethod ?? ""} ${row.path ?? ""}`,
    },
    {
      id: "msg",
      header: "Message",
      accessorKey: "message",
      enableSorting: false,
      cell: ({ getValue }) => clip(getValue<string | null>(), 80),
    },
    {
      id: "trace",
      header: "Trace",
      accessorKey: "traceId",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-mono text-xs underline"
          onClick={() => onSelect(row.original.id)}
        >
          {row.original.traceId}
        </button>
      ),
    },
    {
      id: "errorCode",
      header: "Code",
      accessorKey: "errorCode",
      enableSorting: false,
    },
  ];

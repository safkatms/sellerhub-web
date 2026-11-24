import { Badge } from "@sellerhub/ui/components/badge";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import type { AuditLog, ErrorLog, ImpersonationLog, LoginLog } from "./api";

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
    {
      id: "actor",
      header: "By",
      enableSorting: false,
      cell: ({ row }) => {
        const { actorType, impersonatorAdminId } = row.original;
        if (impersonatorAdminId) return <Badge variant="destructive">Admin as shop</Badge>;
        if (actorType == null) return "-";
        return <Badge variant="outline">{actorLabel[actorType] ?? "-"}</Badge>;
      },
    },
    { id: "ip", header: "IP", accessorKey: "ipAddress", enableSorting: false },
    {
      id: "correlation",
      header: "Correlation",
      accessorKey: "correlationId",
      enableSorting: false,
    },
  ];

const actorLabel: Record<number, string> = { 1: "Shop user", 2: "Platform admin", 3: "System" };

export const impersonationColumns = (): AppColumnDef<ImpersonationLog>[] => [
  {
    id: "startedAtUtc",
    header: "Started",
    accessorKey: "startedAtUtc",
    cell: ({ getValue }) => fmtDate(getValue<string>()),
  },
  { id: "admin", header: "Admin", enableSorting: false, accessorFn: (r) => r.adminName ?? r.adminId },
  { id: "tenant", header: "Shop", enableSorting: false, accessorFn: (r) => r.tenantName ?? r.tenantId },
  { id: "reason", header: "Reason", accessorKey: "reason", enableSorting: false, cell: ({ getValue }) => clip(getValue<string>(), 80) },
  {
    id: "expiresAtUtc",
    header: "Token until",
    accessorKey: "expiresAtUtc",
    enableSorting: false,
    cell: ({ getValue }) => fmtDate(getValue<string>()),
  },
  { id: "ip", header: "IP", accessorKey: "ipAddress", enableSorting: false },
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
    {
      id: "device",
      header: "Device",
      accessorKey: "deviceName",
      enableSorting: false,
      cell: ({ getValue }) => getValue<string | null>() ?? "-",
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

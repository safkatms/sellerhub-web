import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { PlatformAdminStatus } from "@/lib/enums";
import type { AppColumnDef } from "@sellerhub/ui/lib/table";
import type { AdminItem } from "./api";

type ToggleAdmin = {
  mutate: (
    value: { id: string; enable: boolean },
    options: { onError: (error: unknown) => void },
  ) => void;
};

export type AdminActions = {
  toggle: ToggleAdmin;
  onError: (error: unknown) => void;
  onAccess: (admin: AdminItem) => void;
  onResetTwoFactor: (admin: AdminItem) => void;
  /** admin.manage */
  canManage: boolean;
  /** super admins can reset another admin's 2FA */
  canResetTwoFactor: boolean;
  meId: string | undefined;
};

export const adminColumns = (a: AdminActions): AppColumnDef<AdminItem>[] => [
  { id: "fullName", header: "Name", accessorKey: "fullName" },
  { id: "email", header: "Email", accessorKey: "email" },
  {
    id: "roles",
    header: "Access",
    enableSorting: false,
    cell: ({ row }) => {
      const admin = row.original;
      if (admin.isSuperAdmin) return <Badge>Super admin</Badge>;
      const roles = admin.roles ?? [];
      return roles.length === 0
        ? <span className="text-sm text-muted-foreground">View only</span>
        : <div className="flex flex-wrap gap-1">{roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}</div>;
    },
  },
  {
    id: "twoFactor",
    header: "2FA",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={row.original.twoFactorEnabled ? "default" : "outline"}>
        {row.original.twoFactorEnabled ? "On" : "Off"}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ getValue }) => {
      const active = getValue<number>() === PlatformAdminStatus.Active;
      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Active" : "Disabled"}
        </Badge>
      );
    },
  },
  {
    id: "lastLoginAtUtc",
    header: "Last login",
    accessorKey: "lastLoginAtUtc",
    cell: ({ getValue }) => fmtDate(getValue<string | null>()),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const admin = row.original;
      const active = admin.status === PlatformAdminStatus.Active;
      const isMe = admin.id === a.meId;
      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => a.onAccess(admin)}>
            {a.canManage ? "Access" : "View access"}
          </Button>
          {a.canResetTwoFactor && admin.twoFactorEnabled && !isMe && (
            <Button size="sm" variant="ghost" onClick={() => a.onResetTwoFactor(admin)}>Reset 2FA</Button>
          )}
          {a.canManage && !isMe && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => a.toggle.mutate({ id: admin.id, enable: !active }, { onError: a.onError })}
            >
              {active ? "Disable" : "Enable"}
            </Button>
          )}
        </div>
      );
    },
  },
];

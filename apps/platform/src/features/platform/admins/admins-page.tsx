"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@sellerhub/ui/components/dialog";
import { DataTable } from "@sellerhub/ui/data-table";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { useLocalTable, type SortAccessors } from "@sellerhub/ui/hooks/use-local-table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useAuthStore } from "@/features/platform/auth/store";
import { Perm, useAdminAccess, useCan, useMyAccess, useRoles, useSetAdminAccess, useTwoFactor } from "@/features/platform/access/api";
import { useAdmins, useCreateAdmin, useToggleAdmin, type AdminItem } from "./api";
import { adminColumns } from "./columns";

const schema = z.object({
  fullName: z.string().min(1, "Required").max(200),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type Form = z.infer<typeof schema>;

const sortBy: SortAccessors<AdminItem> = {
  fullName: (a) => a.fullName,
  email: (a) => a.email,
  status: (a) => a.status,
  lastLoginAtUtc: (a) => a.lastLoginAtUtc,
};

/** Super admin flag + roles of one admin. */
function AccessDialog({ admin, onClose }: { admin: AdminItem | null; onClose: () => void }) {
  const can = useCan();
  const { data: me } = useMyAccess();
  const { data: roles } = useRoles();
  const { data: access } = useAdminAccess(admin?.id ?? null);
  const save = useSetAdminAccess();
  const [isSuper, setIsSuper] = useState(false);
  const [roleIds, setRoleIds] = useState<Set<number>>(new Set());
  const editable = can(Perm.AdminManage);

  useEffect(() => {
    if (!access) return;
    setIsSuper(access.isSuperAdmin);
    setRoleIds(new Set(access.roleIds));
  }, [access]);

  return (
    <Dialog open={Boolean(admin)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Access: {admin?.fullName}</DialogTitle>
          <DialogDescription>Without a role (and not super admin) an admin can only view.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="flex items-start gap-2 text-sm">
            <Checkbox className="mt-0.5" checked={isSuper} disabled={!editable || !me?.isSuperAdmin}
              onCheckedChange={(c) => setIsSuper(c === true)} />
            <span>
              <span className="font-medium">Super admin</span>
              <span className="block text-xs text-muted-foreground">
                Every permission, including managing admins. Only a super admin can change this.
              </span>
            </span>
          </label>
          <div className="space-y-2">
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Roles</div>
            {roles?.map((r) => (
              <label key={r.id} className="flex items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" checked={roleIds.has(r.id)} disabled={!editable}
                  onCheckedChange={(c) => {
                    const next = new Set(roleIds);
                    if (c === true) next.add(r.id); else next.delete(r.id);
                    setRoleIds(next);
                  }} />
                <span>
                  <span className="font-medium">{r.name}</span>
                  {r.description && <span className="block text-xs text-muted-foreground">{r.description}</span>}
                </span>
              </label>
            ))}
          </div>
          {access && !access.isSuperAdmin && (
            <p className="text-xs text-muted-foreground">
              Current permissions: {access.effectivePermissions.length ? access.effectivePermissions.join(", ") : "none"}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {editable && (
            <Button disabled={!admin || save.isPending} onClick={() => admin && save.mutate(
              { adminId: admin.id, isSuperAdmin: isSuper, roleIds: [...roleIds] },
              { onSuccess: () => { toast.success("Access saved"); onClose(); }, onError: (e) => applyProblem(e) },
            )}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminsPage() {
  const can = useCan();
  const { data: me } = useMyAccess();
  const meId = useAuthStore((s) => s.admin?.id);
  const { data, isLoading } = useAdmins();
  const create = useCreateAdmin();
  const toggle = useToggleAdmin();
  const twoFactor = useTwoFactor();
  const [accessFor, setAccessFor] = useState<AdminItem | null>(null);
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "fullName", desc: false }],
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const submit = (value: Form) =>
    create.mutate(value, {
      onSuccess: () => {
        reset();
        toast.success("Admin created. Give them a role from Access.");
      },
      onError: (error) => applyProblem<Form>(error, setError),
    });

  return (
    <div className="space-y-4">
      {can(Perm.AdminManage) && (
        <Card>
          <CardHeader>
            <CardTitle>New admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(submit)}
              className="grid items-start gap-4 sm:grid-cols-4"
            >
              {(
                [
                  ["fullName", "Full name", "text"],
                  ["email", "Email", "email"],
                  ["password", "Initial password", "password"],
                ] as const
              ).map(([name, label, type]) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Input id={name} type={type} {...register(name)} />
                  {errors[name] && (
                    <p className="text-sm text-destructive">
                      {errors[name]?.message}
                    </p>
                  )}
                </div>
              ))}
              <Button
                type="submit"
                className="sm:mt-6"
                disabled={create.isPending}
              >
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={adminColumns({
          toggle,
          onError: (error) => applyProblem(error),
          onAccess: setAccessFor,
          onResetTwoFactor: (admin) =>
            confirm(`Reset two-factor for ${admin.fullName}? They are signed out and can set it up again.`) &&
            twoFactor.reset.mutate(admin.id, { onSuccess: () => toast.success("Two-factor reset"), onError: (e) => applyProblem(e) }),
          canManage: can(Perm.AdminManage),
          canResetTwoFactor: Boolean(me?.isSuperAdmin),
          meId,
        })}
        loading={isLoading}
        {...table}
      />

      <AccessDialog admin={accessFor} onClose={() => setAccessFor(null)} />
    </div>
  );
}

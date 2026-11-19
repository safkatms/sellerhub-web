"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan, useDeleteRole, usePlatformPermissions, useRoles, useSaveRole, type PlatformRole } from "./api";

type Editing = { role: PlatformRole | null } | null;

/** Platform roles: named bundles of permissions. Super admins hold every permission without a role. */
export function RolesPage() {
  const can = useCan();
  const { data: roles, isLoading } = useRoles();
  const { data: permissions } = usePlatformPermissions();
  const save = useSaveRole();
  const remove = useDeleteRole();
  const [editing, setEditing] = useState<Editing>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [codes, setCodes] = useState<Set<string>>(new Set());
  const editable = can(Perm.AdminManage);

  const open = (role: PlatformRole | null) => {
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setCodes(new Set(role?.permissionCodes ?? []));
    setEditing({ role });
  };

  const modules = new Map<string, NonNullable<typeof permissions>>();
  for (const p of permissions ?? []) modules.set(p.module, [...(modules.get(p.module) ?? []), p]);
  const nameOf = (code: string) => permissions?.find((p) => p.code === code)?.name ?? code;

  if (isLoading) return <Spinner className="mx-auto mt-12 size-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          An admin gets the permissions of all their roles. Super admins have every permission.
        </p>
        {editable && <Button onClick={() => open(null)}>New role</Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles?.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{r.name}</span>
                <Badge variant="secondary">{r.adminCount} admin(s)</Badge>
              </CardTitle>
              {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {r.permissionCodes.length === 0 && <span className="text-sm text-muted-foreground">No permissions</span>}
                {r.permissionCodes.map((c) => <Badge key={c} variant="outline">{nameOf(c)}</Badge>)}
              </div>
              {editable && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => open(r)}>Edit</Button>
                  <Button size="sm" variant="ghost" disabled={remove.isPending}
                    onClick={() => confirm(`Delete role "${r.name}"? It is removed from ${r.adminCount} admin(s).`) &&
                      remove.mutate(r.id, { onSuccess: () => toast.success("Role deleted"), onError: (e) => applyProblem(e) })}>
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing?.role ? `Edit ${editing.role.name}` : "New role"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Name</Label>
              <Input id="role-name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc">Description</Label>
              <Input id="role-desc" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {[...modules.entries()].map(([module, items]) => (
              <div key={module} className="space-y-2">
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{module}</div>
                {items.map((p) => (
                  <label key={p.code} className="flex items-start gap-2 text-sm">
                    <Checkbox className="mt-0.5" checked={codes.has(p.code)} onCheckedChange={(c) => {
                      const next = new Set(codes);
                      if (c === true) next.add(p.code); else next.delete(p.code);
                      setCodes(next);
                    }} />
                    <span>
                      <span className="font-medium">{p.name}</span>
                      {p.description && <span className="block text-xs text-muted-foreground">{p.description}</span>}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={!name.trim() || save.isPending} onClick={() =>
              save.mutate(
                { id: editing?.role?.id, body: { name: name.trim(), description: description.trim() || null,
                  permissionCodes: [...codes], rowVersion: editing?.role?.rowVersion ?? null } },
                { onSuccess: () => { toast.success("Role saved"); setEditing(null); }, onError: (e) => applyProblem(e) },
              )}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Spinner } from "@sellerhub/ui/components/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sellerhub/ui/components/tabs";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { useAuthStore } from "@/features/platform/auth/store";
import {
  Perm,
  useAdminAccess,
  useCan,
  useMyAccess,
  useRoles,
  useSetAdminAccess,
} from "@/features/platform/roles/api";
import { useAdmins, useCreateAdmin, useToggleAdmin } from "./api";
import { useTwoFactor } from "../security/api";

const schema = z.object({
  fullName: z.string().trim().min(1, "Required").max(200),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type Form = z.infer<typeof schema>;

export function AdminPage({ id }: { id?: string }) {
  const isNew = !id;
  const router = useRouter();
  const can = useCan();
  const manage = can(Perm.AdminManage);
  const { data: me } = useMyAccess();
  const meId = useAuthStore((s) => s.admin?.id);
  const { data: admins, isLoading } = useAdmins();
  const admin = admins?.find((a) => a.id === id);
  const create = useCreateAdmin();
  const toggle = useToggleAdmin();
  const twoFactor = useTwoFactor();
  const { data: roles } = useRoles();
  const { data: access } = useAdminAccess(admin?.id ?? null);
  const saveAccess = useSetAdminAccess();
  const [tab, setTab] = useState<"details" | "access" | "actions">("details");
  const [isSuper, setIsSuper] = useState(false);
  const [roleIds, setRoleIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!access) return;
    setIsSuper(access.isSuperAdmin);
    setRoleIds(new Set(access.roleIds));
  }, [access]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  if (!isNew && isLoading) return <Spinner className="mx-auto mt-12 size-8" />;
  if (!isNew && !admin) return null;

  const active = admin?.status === 1; // assumed: 1 = active
  const isMe = admin?.id === meId;

  const submit = (v: Form) =>
    create.mutate(v, {
      onSuccess: () => {
        toast.success("Admin created. Give them a role from Access.");
        router.replace("/platform/admins");
      },
      onError: (e) => applyProblem<Form>(e, setError),
    });

  return (
    <div className="space-y-4">
      {admin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {admin.fullName}
              <Badge variant={active ? "default" : "secondary"}>
                {active ? "Active" : "Disabled"}
              </Badge>
              {access?.isSuperAdmin && (
                <Badge variant="outline">Super admin</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div>Email: {admin.email}</div>
            <div>
              Last login:{" "}
              {admin.lastLoginAtUtc ? fmtDate(admin.lastLoginAtUtc) : "Never"}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="space-y-4"
      >
        <TabsList variant="line">
          <TabsTrigger value="details">Details</TabsTrigger>
          {!isNew && <TabsTrigger value="access">Access</TabsTrigger>}
          {!isNew && manage && (
            <TabsTrigger value="actions">Actions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{isNew ? "New admin" : "Admin details"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isNew ? (
                <form onSubmit={handleSubmit(submit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                  <Button type="submit" disabled={!manage || create.isPending}>
                    Create
                  </Button>
                </form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input value={admin!.fullName} disabled readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={admin!.email} disabled readOnly />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && admin && (
          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>Access</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Without a role (and not super admin) an admin can only view.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={isSuper}
                    disabled={!manage || !me?.isSuperAdmin}
                    onCheckedChange={(c) => setIsSuper(c === true)}
                  />
                  <span>
                    <span className="font-medium">Super admin</span>
                    <span className="block text-xs text-muted-foreground">
                      Every permission, including managing admins. Only a super
                      admin can change this.
                    </span>
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Roles
                  </div>
                  {roles?.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={roleIds.has(r.id)}
                        disabled={!manage}
                        onCheckedChange={(c) => {
                          const next = new Set(roleIds);
                          if (c === true) next.add(r.id);
                          else next.delete(r.id);
                          setRoleIds(next);
                        }}
                      />
                      <span>
                        <span className="font-medium">{r.name}</span>
                        {r.description && (
                          <span className="block text-xs text-muted-foreground">
                            {r.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                {access && !access.isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Current permissions:{" "}
                    {access.effectivePermissions.length
                      ? access.effectivePermissions.join(", ")
                      : "none"}
                  </p>
                )}
                {manage && (
                  <Button
                    disabled={saveAccess.isPending}
                    onClick={() =>
                      saveAccess.mutate(
                        {
                          adminId: admin.id,
                          isSuperAdmin: isSuper,
                          roleIds: [...roleIds],
                        },
                        {
                          onSuccess: () => toast.success("Access saved"),
                          onError: (e) => applyProblem(e),
                        },
                      )
                    }
                  >
                    Save access
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isNew && admin && manage && (
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant={active ? "destructive" : "default"}
                  disabled={toggle.isPending || (isMe && active)}
                  onClick={() =>
                    toggle.mutate(
                      { id: admin.id, enable: !active },
                      { onError: (e) => applyProblem(e) },
                    )
                  }
                >
                  {active ? "Disable" : "Enable"}
                </Button>
                {me?.isSuperAdmin &&
                  admin.twoFactorEnabled && ( // assumed field
                    <Button
                      variant="outline"
                      disabled={twoFactor.reset.isPending}
                      onClick={() =>
                        confirm(
                          `Reset two-factor for ${admin.fullName}? They are signed out and can set it up again.`,
                        ) &&
                        twoFactor.reset.mutate(admin.id, {
                          onSuccess: () => toast.success("Two-factor reset"),
                          onError: (e) => applyProblem(e),
                        })
                      }
                    >
                      Reset two-factor
                    </Button>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

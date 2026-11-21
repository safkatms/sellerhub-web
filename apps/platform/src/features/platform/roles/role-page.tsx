"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Perm,
  useCan,
  useDeleteRole,
  usePlatformPermissions,
  useRoles,
  useSaveRole,
} from "./api";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  description: z.string().trim().max(500).optional(),
  permissionCodes: z.array(z.string()),
});
type FormValues = z.infer<typeof schema>;

export function RolePage({ id }: { id?: string }) {
  const isNew = !id;
  const router = useRouter();
  const can = useCan();
  const editable = can(Perm.AdminManage);
  const { data: roles, isLoading } = useRoles();
  const role = roles?.find((r) => String(r.id) === id);
  const { data: permissions } = usePlatformPermissions();
  const save = useSaveRole();
  const remove = useDeleteRole();
  const [tab, setTab] = useState<"details" | "actions">("details");

  const {
    register,
    reset,
    control,
    setValue,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", permissionCodes: [] },
  });
  const codes = useWatch({ control, name: "permissionCodes" }) ?? [];

  useEffect(() => {
    if (!role) return;
    reset({
      name: role.name,
      description: role.description ?? "",
      permissionCodes: role.permissionCodes,
    });
  }, [role, reset]);

  if (!isNew && isLoading) return <Spinner className="mx-auto mt-12 size-8" />;
  if (!isNew && !role) return null;

  const modules = new Map<string, NonNullable<typeof permissions>>();
  for (const p of permissions ?? [])
    modules.set(p.module, [...(modules.get(p.module) ?? []), p]);

  const toggle = (code: string, on: boolean) => {
    const next = new Set(codes);
    if (on) next.add(code);
    else next.delete(code);
    setValue("permissionCodes", [...next], { shouldDirty: true });
  };

  const submit = (v: FormValues) =>
    save.mutate(
      {
        id: role?.id,
        body: {
          name: v.name,
          description: v.description || null,
          permissionCodes: v.permissionCodes,
          rowVersion: role?.rowVersion ?? null,
        },
      },
      {
        onSuccess: () => {
          toast.success(isNew ? "Role created" : "Role saved");
          if (isNew) router.replace("/platform/roles");
        },
        onError: (e) => applyProblem<FormValues>(e, setError),
      },
    );

  return (
    <div className="space-y-4">
      {role && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {role.name}
              <Badge variant="secondary">{role.adminCount} admin(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {role.description || "No description"} ·{" "}
            {role.permissionCodes.length} permission(s)
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
          {!isNew && editable && (
            <TabsTrigger value="actions">Actions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{isNew ? "New role" : "Role details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(submit)} className="space-y-4">
                <fieldset disabled={!editable} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" maxLength={100} {...register("name")} />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        maxLength={500}
                        {...register("description")}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Permissions</Label>
                    {[...modules.entries()].map(([module, items]) => (
                      <div key={module} className="space-y-2">
                        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {module}
                        </div>
                        {items.map((p) => (
                          <label
                            key={p.code}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Checkbox
                              className="mt-0.5"
                              checked={codes.includes(p.code)}
                              onCheckedChange={(c) =>
                                toggle(p.code, c === true)
                              }
                            />
                            <span>
                              <span className="font-medium">{p.name}</span>
                              {p.description && (
                                <span className="block text-xs text-muted-foreground">
                                  {p.description}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </fieldset>
                {editable && (
                  <div className="flex gap-2">
                    <Button type="submit" disabled={save.isPending}>
                      {isNew ? "Create" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/platform/roles")}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && role && editable && (
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() =>
                    confirm(
                      `Delete role "${role.name}"? It is removed from ${role.adminCount} admin(s).`,
                    ) &&
                    remove.mutate(role.id, {
                      onSuccess: () => {
                        toast.success("Role deleted");
                        router.replace("/platform/roles");
                      },
                      onError: (e) => applyProblem(e),
                    })
                  }
                >
                  Delete role
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

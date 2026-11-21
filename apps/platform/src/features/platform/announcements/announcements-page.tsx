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
import dayjs, { getDisplayZone } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/roles/api";
import { usePlans } from "@/features/platform/plans/api";
import { useTenants } from "@/features/platform/tenants/api";
import {
  Severity,
  Target,
  severityLabel,
  useAnnouncementMutations,
  useAnnouncements,
} from "./api";
import { audienceOf, statusOf } from "./columns";

const select = "h-9 w-full rounded-md border bg-background px-2 text-sm";
const toUtc = (local?: string) =>
  local ? dayjs.tz(local, getDisplayZone()).utc().toISOString() : null;
const toLocal = (utc: string | null) =>
  utc ? dayjs.utc(utc).tz(getDisplayZone()).format("YYYY-MM-DDTHH:mm") : "";

const schema = z
  .object({
    title: z.string().trim().min(1, "Required").max(200),
    body: z.string().trim().min(1, "Required").max(4000),
    severity: z.coerce.number(),
    targetType: z.coerce.number(),
    targetPlanId: z.string().optional(),
    targetTenantId: z.string().optional(),
    starts: z.string().optional(),
    ends: z.string().optional(),
    isDismissible: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.targetType === Target.Plan && !v.targetPlanId)
      ctx.addIssue({
        code: "custom",
        path: ["targetPlanId"],
        message: "Choose a plan",
      });
    if (v.targetType === Target.Tenant && !v.targetTenantId)
      ctx.addIssue({
        code: "custom",
        path: ["targetTenantId"],
        message: "Choose a shop",
      });
    if (v.starts && v.ends && v.ends <= v.starts)
      ctx.addIssue({
        code: "custom",
        path: ["ends"],
        message: "Must be after the start",
      });
  });
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const defaults: FormInput = {
  title: "",
  body: "",
  severity: Severity.Info,
  targetType: Target.All,
  targetPlanId: "",
  targetTenantId: "",
  starts: "",
  ends: "",
  isDismissible: true,
  isActive: true,
};

export function AnnouncementPage({ id }: { id?: string }) {
  const isNew = !id;
  const router = useRouter();
  const can = useCan();
  const editable = can(Perm.AnnouncementManage);
  const { data: list, isLoading } = useAnnouncements();
  const announcement = list?.find((a) => a.id === id);
  const { data: plans } = usePlans();
  const [shopSearch, setShopSearch] = useState("");
  const { data: shops } = useTenants({
    page: 1,
    pageSize: 20,
    search: shopSearch || undefined,
  });
  const m = useAnnouncementMutations();
  const [tab, setTab] = useState<"details" | "actions">("details");

  const {
    register,
    reset,
    control,
    setValue,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const targetType = Number(useWatch({ control, name: "targetType" }));
  const isDismissible = useWatch({ control, name: "isDismissible" });
  const isActive = useWatch({ control, name: "isActive" });
  const targetTenantId = useWatch({ control, name: "targetTenantId" });

  useEffect(() => {
    if (!announcement) return;
    reset({
      title: announcement.title,
      body: announcement.body,
      severity: announcement.severity,
      targetType: announcement.targetType,
      targetPlanId: announcement.targetPlanId?.toString() ?? "",
      targetTenantId: announcement.targetTenantId ?? "",
      starts: toLocal(announcement.startsAtUtc),
      ends: toLocal(announcement.endsAtUtc),
      isDismissible: announcement.isDismissible,
      isActive: announcement.isActive,
    });
    setShopSearch(announcement.targetTenantName ?? "");
  }, [announcement, reset]);

  if (!isNew && isLoading) return <Spinner className="mx-auto mt-12 size-8" />;
  if (!isNew && !announcement) return null;

  const submit = (v: FormValues) => {
    m.save.mutate(
      {
        id: announcement?.id,
        body: {
          title: v.title,
          body: v.body,
          severity: v.severity,
          targetType: v.targetType,
          targetPlanId:
            v.targetType === Target.Plan ? Number(v.targetPlanId) : null,
          targetTenantId:
            v.targetType === Target.Tenant ? (v.targetTenantId ?? null) : null,
          startsAtUtc: toUtc(v.starts),
          endsAtUtc: toUtc(v.ends),
          isDismissible: v.isDismissible,
          isActive: v.isActive,
          rowVersion: announcement?.rowVersion ?? null,
        },
      },
      {
        onSuccess: () => {
          toast.success(isNew ? "Announcement created" : "Announcement saved");
          if (isNew) router.replace("/platform/announcements");
        },
        onError: (e) => applyProblem<FormInput>(e, setError),
      },
    );
  };

  return (
    <div className="space-y-4">
      {announcement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {announcement.title}
              <Badge variant={announcement.isLive ? "default" : "outline"}>
                {statusOf(announcement)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div>Audience: {audienceOf(announcement)}</div>
            <div>
              Dismissed by:{" "}
              {announcement.isDismissible
                ? `${announcement.dismissCount} user(s)`
                : "Not dismissible"}
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
          {!isNew && editable && (
            <TabsTrigger value="actions">Actions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>
                {isNew ? "New announcement" : "Announcement details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(submit)} className="space-y-4">
                <fieldset disabled={!editable} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        maxLength={200}
                        {...register("title")}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">
                          {errors.title.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="body">Message</Label>
                      <textarea
                        id="body"
                        className="min-h-24 w-full rounded-md border bg-background p-2 text-sm"
                        maxLength={4000}
                        {...register("body")}
                      />
                      {errors.body && (
                        <p className="text-sm text-destructive">
                          {errors.body.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="severity">Severity</Label>
                      <select
                        id="severity"
                        className={select}
                        {...register("severity")}
                      >
                        {Object.entries(severityLabel).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="targetType">Audience</Label>
                      <select
                        id="targetType"
                        className={select}
                        {...register("targetType")}
                      >
                        <option value={Target.All}>All shops</option>
                        <option value={Target.Plan}>Shops on a plan</option>
                        <option value={Target.Tenant}>One shop</option>
                      </select>
                    </div>

                    {targetType === Target.Plan && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="targetPlanId">Plan</Label>
                        <select
                          id="targetPlanId"
                          className={select}
                          {...register("targetPlanId")}
                        >
                          <option value="">Choose…</option>
                          {plans?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {errors.targetPlanId && (
                          <p className="text-sm text-destructive">
                            {errors.targetPlanId.message}
                          </p>
                        )}
                      </div>
                    )}

                    {targetType === Target.Tenant && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="targetTenantId">Shop</Label>
                        <Input
                          placeholder="Search shops…"
                          value={shopSearch}
                          onChange={(e) => setShopSearch(e.target.value)}
                        />
                        <select
                          id="targetTenantId"
                          className={select}
                          {...register("targetTenantId")}
                        >
                          <option value="">Choose…</option>
                          {shops?.items.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.slug})
                            </option>
                          ))}
                          {targetTenantId &&
                            !shops?.items.some(
                              (s) => s.id === targetTenantId,
                            ) && (
                              <option value={targetTenantId}>
                                {announcement?.targetTenantName ??
                                  targetTenantId}
                              </option>
                            )}
                        </select>
                        {errors.targetTenantId && (
                          <p className="text-sm text-destructive">
                            {errors.targetTenantId.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="starts">
                        Starts ({getDisplayZone()})
                      </Label>
                      <Input
                        id="starts"
                        type="datetime-local"
                        {...register("starts")}
                      />
                      <p className="text-xs text-muted-foreground">
                        Empty = now
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ends">Ends (optional)</Label>
                      <Input
                        id="ends"
                        type="datetime-local"
                        {...register("ends")}
                      />
                      {errors.ends && (
                        <p className="text-sm text-destructive">
                          {errors.ends.message}
                        </p>
                      )}
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isDismissible}
                        onCheckedChange={(c) =>
                          setValue("isDismissible", c === true)
                        }
                      />{" "}
                      Shops can close it
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isActive}
                        onCheckedChange={(c) =>
                          setValue("isActive", c === true)
                        }
                      />{" "}
                      Active
                    </label>
                  </div>
                </fieldset>
                {editable && (
                  <Button type="submit" disabled={m.save.isPending}>
                    {isNew ? "Create" : "Save"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && announcement && editable && (
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  disabled={m.remove.isPending}
                  onClick={() =>
                    confirm("Delete this announcement?") &&
                    m.remove.mutate(announcement.id, {
                      onSuccess: () => {
                        toast.success("Deleted");
                        router.replace("/platform/announcements");
                      },
                      onError: (e) => applyProblem(e),
                    })
                  }
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

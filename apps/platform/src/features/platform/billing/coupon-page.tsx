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
import { Perm, useCan } from "@/features/platform/roles/api";
import { usePlans } from "@/features/platform/plans/api";
import {
  CouponDiscountType,
  money,
  useCouponMutations,
  useCoupons,
} from "./api";

const select = "h-9 w-full rounded-md border bg-background px-2 text-sm";
const optInt = (s?: string) => (!s || s.trim() === "" ? null : Number(s));
const dateToUtc = (d?: string) =>
  d ? new Date(`${d}T00:00:00Z`).toISOString() : null;

const schema = z
  .object({
    code: z.string().trim().min(1, "Required").max(50),
    description: z.string().trim().max(500).optional(),
    discountType: z.coerce.number(),
    discountValue: z
      .string()
      .refine((v) => Number(v) > 0, "Must be more than 0"),
    maxRedemptions: z.string().optional(),
    maxPerTenant: z.string().optional(),
    planId: z.string().optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (
      v.discountType === CouponDiscountType.Percent &&
      Number(v.discountValue) > 100
    )
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percent cannot exceed 100",
      });
    if (v.validFrom && v.validTo && v.validTo <= v.validFrom)
      ctx.addIssue({
        code: "custom",
        path: ["validTo"],
        message: "Must be after the start",
      });
  });
type FormValues = z.infer<typeof schema>;

export function CouponPage({ id }: { id?: string }) {
  const isNew = !id;
  const router = useRouter();
  const can = useCan();
  const editable = can(Perm.BillingManage);
  const { data: list, isLoading } = useCoupons();
  const coupon = list?.find((c) => c.id === id);
  const { data: plans } = usePlans();
  const m = useCouponMutations();
  const [tab, setTab] = useState<"details" | "actions">("details");
  type FormInput = z.input<typeof schema>;
  type FormValues = z.output<typeof schema>;
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
    defaultValues: {
      code: "",
      description: "",
      discountType: CouponDiscountType.Percent,
      discountValue: "",
      maxRedemptions: "",
      maxPerTenant: "1",
      planId: "",
      validFrom: "",
      validTo: "",
      isActive: true,
    },
  });
  const discountType = Number(useWatch({ control, name: "discountType" }));
  const isActive = useWatch({ control, name: "isActive" });

  useEffect(() => {
    if (!coupon) return;
    reset({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxRedemptions: coupon.maxRedemptions?.toString() ?? "",
      maxPerTenant: coupon.maxPerTenant?.toString() ?? "",
      planId: coupon.planId?.toString() ?? "",
      validFrom: coupon.validFromUtc?.slice(0, 10) ?? "",
      validTo: coupon.validToUtc?.slice(0, 10) ?? "",
      isActive: coupon.isActive,
    });
  }, [coupon, reset]);

  if (!isNew && isLoading) return <Spinner className="mx-auto mt-12 size-8" />;
  if (!isNew && !coupon) return null;

  const submit = (v: FormValues) =>
    m.save.mutate(
      {
        id: coupon?.id,
        body: {
          code: v.code,
          description: v.description || null,
          discountType: v.discountType,
          discountValue: Number(v.discountValue),
          maxRedemptions: optInt(v.maxRedemptions),
          maxPerTenant: optInt(v.maxPerTenant),
          planId: optInt(v.planId),
          validFromUtc: dateToUtc(v.validFrom),
          validToUtc: dateToUtc(v.validTo),
          isActive: v.isActive,
          rowVersion: coupon?.rowVersion ?? null,
        },
      },
      {
        onSuccess: () => {
          toast.success(isNew ? "Coupon created" : "Coupon saved");
          if (isNew) router.replace("/platform/billing/coupons");
        },
        onError: (e) => applyProblem<FormInput>(e, setError),
      },
    );

  return (
    <div className="space-y-4">
      {coupon && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <code>{coupon.code}</code>
              <Badge variant={coupon.isActive ? "default" : "secondary"}>
                {coupon.isActive ? "Active" : "Off"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div>
              Discount:{" "}
              {coupon.discountType === CouponDiscountType.Percent
                ? `${coupon.discountValue}%`
                : money(coupon.discountValue)}
            </div>
            <div>
              Used: {coupon.redeemedCount}
              {coupon.maxRedemptions != null && ` / ${coupon.maxRedemptions}`}
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
              <CardTitle>{isNew ? "New coupon" : "Coupon details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(submit)} className="space-y-4">
                <fieldset disabled={!editable} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="code">Code</Label>
                      <Input
                        id="code"
                        maxLength={50}
                        placeholder="EID20"
                        {...register("code", {
                          onChange: (e) =>
                            setValue("code", e.target.value.toUpperCase()),
                        })}
                      />
                      {errors.code && (
                        <p className="text-sm text-destructive">
                          {errors.code.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="planId">Plan</Label>
                      <select
                        id="planId"
                        className={select}
                        {...register("planId")}
                      >
                        <option value="">Any plan</option>
                        {plans?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="discountType">Type</Label>
                      <select
                        id="discountType"
                        className={select}
                        {...register("discountType")}
                      >
                        <option value={CouponDiscountType.Percent}>
                          Percent
                        </option>
                        <option value={CouponDiscountType.Fixed}>
                          Fixed amount (৳)
                        </option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="discountValue">
                        {discountType === CouponDiscountType.Percent
                          ? "Percent off"
                          : "Amount off"}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min={0}
                        step="0.01"
                        {...register("discountValue")}
                      />
                      {errors.discountValue && (
                        <p className="text-sm text-destructive">
                          {errors.discountValue.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maxRedemptions">
                        Max uses (blank = unlimited)
                      </Label>
                      <Input
                        id="maxRedemptions"
                        type="number"
                        min={1}
                        {...register("maxRedemptions")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maxPerTenant">
                        Max per shop (blank = unlimited)
                      </Label>
                      <Input
                        id="maxPerTenant"
                        type="number"
                        min={1}
                        {...register("maxPerTenant")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="validFrom">Valid from (UTC date)</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        {...register("validFrom")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="validTo">Valid until (UTC date)</Label>
                      <Input
                        id="validTo"
                        type="date"
                        {...register("validTo")}
                      />
                      {errors.validTo && (
                        <p className="text-sm text-destructive">
                          {errors.validTo.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        maxLength={500}
                        {...register("description")}
                      />
                    </div>
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
                  <div className="flex gap-2">
                    <Button type="submit" disabled={m.save.isPending}>
                      {isNew ? "Create" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/platform/billing/coupons")}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && coupon && editable && (
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
                    confirm(`Delete coupon ${coupon.code}?`) &&
                    m.remove.mutate(coupon.id, {
                      onSuccess: () => {
                        toast.success("Deleted");
                        router.replace("/platform/billing/coupons");
                      },
                      onError: (e) => applyProblem(e),
                    })
                  }
                >
                  Delete coupon
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

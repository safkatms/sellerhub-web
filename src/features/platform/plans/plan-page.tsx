"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useCreatePlan, usePlan, useTogglePlan, useUpdatePlan } from "./api";
import { applyProblem } from "@/lib/api/errors";

const nullableNumber = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.coerce.number().int().min(0).nullable(),
);
const limitSchema = z.object({
  key: z.string().trim().min(1, "Required"),
  value: nullableNumber,
});
const schema = z.object({
  code: z.string().trim().min(1, "Required").max(50),
  name: z.string().trim().min(1, "Required").max(200),
  description: z.string().trim().optional(),
  sortOrder: z.coerce.number().int(),
  monthlyPrice: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().min(0).nullable(),
  ),
  limits: z.array(limitSchema),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function PlanPage({ id }: { id?: string }) {
  const isNew = !id;
  const numericId = id ? Number(id) : undefined;
  const router = useRouter();
  const { data: plan, isLoading } = usePlan(numericId);
  const create = useCreatePlan();
  const update = useUpdatePlan(numericId ?? 0);
  const toggle = useTogglePlan();
  const [tab, setTab] = useState<"details" | "actions">("details");
  const {
    register,
    reset,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      sortOrder: 0,
      monthlyPrice: null,
      limits: [],
    },
  });
  const limits = useFieldArray({ control, name: "limits" });

  useEffect(() => {
    if (!plan) return;
    reset({
      code: plan.code,
      name: plan.name,
      description: plan.description ?? "",
      sortOrder: plan.sortOrder,
      monthlyPrice: plan.monthlyPrice,
      limits: plan.limits,
    });
  }, [plan, reset]);

  if (!isNew && isLoading) {
    return <Spinner className="mx-auto mt-12 size-8" />;
  }
  if (!isNew && !plan) return null;

  const submit = (values: FormValues) => {
    const body = {
      name: values.name,
      description: values.description || null,
      sortOrder: values.sortOrder,
      monthlyPrice: values.monthlyPrice,
      limits: values.limits.map((limit) => ({
        key: limit.key,
        value: limit.value,
      })),
    };

    if (isNew) {
      create.mutate(
        { code: values.code, ...body },
        {
          onSuccess: (result) => {
            toast.success("Plan created");
            router.replace(`/platform/plans/${result.id}`);
          },
          onError: (error) => applyProblem<FormInput>(error, setError),
        },
      );
    } else {
      update.mutate(
        { ...body, rowVersion: plan!.rowVersion },
        {
          onSuccess: () => toast.success("Plan saved"),
          onError: (error) => applyProblem<FormInput>(error, setError),
        },
      );
    }
  };

  return (
    <div className="space-y-4">
      {!isNew && plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {plan.name}
              <Badge variant={plan.isActive ? "default" : "secondary"}>
                {plan.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div>Code: {plan.code}</div>
            <div>
              Price:{" "}
              {plan.monthlyPrice != null
                ? `৳${plan.monthlyPrice}`
                : "Unlimited"}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as typeof tab)}
        className="space-y-4"
      >
        <TabsList variant="line">
          <TabsTrigger value="details">Details</TabsTrigger>
          {!isNew && <TabsTrigger value="actions">Actions</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{isNew ? "New plan" : "Plan details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(submit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Code</Label>
                    <Input id="code" {...register("code")} disabled={!isNew} />
                    {errors.code && (
                      <p className="text-sm text-destructive">
                        {errors.code.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sortOrder">Sort order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      {...register("sortOrder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="monthlyPrice">Monthly price</Label>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      {...register("monthlyPrice")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" {...register("description")} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Limits</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => limits.append({ key: "", value: null })}
                    >
                      Add limit
                    </Button>
                  </div>
                  {limits.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        placeholder="Key"
                        {...register(`limits.${index}.key`)}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="Value (blank = unlimited)"
                        {...register(`limits.${index}.value`)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => limits.remove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="submit"
                  disabled={create.isPending || update.isPending}
                >
                  {isNew ? "Create" : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && plan && (
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant={plan.isActive ? "destructive" : "default"}
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate(
                      { id: plan.id, active: !plan.isActive },
                      { onError: (error) => applyProblem(error) },
                    )
                  }
                >
                  {plan.isActive ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

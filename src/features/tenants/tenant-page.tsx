"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateTenant,
  useRecordSubscription,
  useSubscriptions,
  useTenant,
  useTenantAction,
  useUpdateTenant,
} from "./api";
import { usePlans } from "@/features/plans/api";
import { applyProblem } from "@/lib/api/errors";
import { fmtDate } from "@/lib/dayjs";
import {
  planStateLabel,
  planStateVariant,
  sourceLabel,
  TenantCurrency,
  TenantLanguage,
  TenantStatus,
  TenantTimeZone,
} from "@/lib/enums";
import { Copy } from "lucide-react";

const opt = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);
const schema = z.object({
  name: z.string().min(1, "Required").max(200),
  slug: opt,
  email: opt,
  phone: opt,
  timeZone: z.enum([TenantTimeZone.Bangladesh]),
  language: z.enum([TenantLanguage.English, TenantLanguage.Bangla]),
  currency: z.enum([TenantCurrency.Bangladesh]),
  ownerFullName: z.string().min(1, "Required").max(200),
  ownerEmail: opt,
  ownerPhone: opt,
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

type Props = { id?: string };
type Tab = "details" | "actions" | "subscriptions";

const fields: [keyof FormInput, string][] = [
  ["name", "Shop name"],
  ["slug", "Slug (optional)"],
  ["email", "Shop email"],
  ["phone", "Shop phone"],
  ["ownerFullName", "Owner full name"],
  ["ownerEmail", "Owner email"],
  ["ownerPhone", "Owner phone"],
];

export function TenantPage({ id }: Props) {
  const isNew = !id;
  const router = useRouter();
  const { data: tenant, isLoading: tenantLoading } = useTenant(id ?? "");
  const { data: subs } = useSubscriptions(id ?? "");
  const { data: plans } = usePlans();
  const create = useCreateTenant();
  const update = useUpdateTenant(id ?? "");
  const actions = useTenantAction(id ?? "");
  const record = useRecordSubscription(id ?? "");
  const [tab, setTab] = useState<Tab>("details");
  const [reason, setReason] = useState("");
  const [planId, setPlanId] = useState<number>();
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      timeZone: TenantTimeZone.Bangladesh,
      language: TenantLanguage.English,
      currency: TenantCurrency.Bangladesh,
    },
  });
  const language = useWatch({ control, name: "language" });

  useEffect(() => {
    if (!tenant) return;
    reset({
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email ?? undefined,
      phone: tenant.phone ?? undefined,
      timeZone:
        tenant.timeZone === TenantTimeZone.Bangladesh
          ? tenant.timeZone
          : TenantTimeZone.Bangladesh,
      language:
        tenant.language === TenantLanguage.Bangla
          ? TenantLanguage.Bangla
          : TenantLanguage.English,
      currency: TenantCurrency.Bangladesh,
      ownerFullName: tenant.owner?.fullName ?? "",
      ownerEmail: tenant.owner?.email ?? undefined,
      ownerPhone: tenant.owner?.phone ?? undefined,
    });
  }, [tenant, reset]);

  const submit = (values: FormValues) => {
    if (isNew) {
      create.mutate(values, {
        onSuccess: (result) => {
          setPassword({
            id: result.tenant.id,
            value: result.ownerTemporaryPassword,
          });
        },
        onError: (error) => applyProblem<FormInput>(error, setError),
      });
      return;
    }

    update.mutate(
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        timeZone: values.timeZone,
        language: values.language,
        currency: TenantCurrency.Bangladesh,
        rowVersion: tenant?.rowVersion ?? "",
      },
      {
        onSuccess: () => toast.success("Saved"),
        onError: (error) => applyProblem<FormInput>(error, setError),
      },
    );
  };

  if (!isNew && tenantLoading) {
    return <Spinner className="mx-auto mt-12 size-8" />;
  }
  if (!isNew && !tenant) return null;

  const onError = (error: unknown) => applyProblem(error);
  const pending = create.isPending || update.isPending;

  return (
    <div className="space-y-4">
      <Dialog
        open={Boolean(password)}
        onOpenChange={(open) => {
          if (!open) setPassword(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Owner temporary password</DialogTitle>
            <DialogDescription>
              This password is shown once. Save it before opening the shop.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="block flex-1 rounded bg-muted p-2 select-all">
              {password?.value}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy password"
              onClick={async () => {
                if (!password) return;
                try {
                  await navigator.clipboard.writeText(password.value);
                  toast.success("Password copied");
                } catch {
                  toast.error("Could not copy password");
                }
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (password) router.push(`/tenants/${password.id}`);
              }}
            >
              Open shop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isNew && tenant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tenant.name}
              <Badge variant={planStateVariant[tenant.planState]}>
                {planStateLabel[tenant.planState]}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm sm:grid-cols-2">
            <div>Plan: {tenant.planName}</div>
            <div>Expires: {fmtDate(tenant.planExpiresAtUtc)}</div>
            <div>Users: {tenant.userCount}</div>
            <div>Owner: {tenant.owner?.fullName ?? "-"}</div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        className="space-y-4"
      >
        <TabsList variant="line">
          <TabsTrigger value="details">Details</TabsTrigger>
          {!isNew && <TabsTrigger value="actions">Actions</TabsTrigger>}
          {!isNew && (
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{isNew ? "New shop" : "Shop details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(submit)}
                className="grid gap-4 sm:grid-cols-2"
              >
                {fields.map(([name, label]) => (
                  <div key={name} className="space-y-1.5">
                    <Label htmlFor={name}>{label}</Label>
                    <Input
                      id={name}
                      {...register(name)}
                      disabled={
                        !isNew && (name === "slug" || name.startsWith("owner"))
                      }
                    />
                    {errors[name] && (
                      <p className="text-sm text-destructive">
                        {errors[name]?.message as string}
                      </p>
                    )}
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label htmlFor="timeZone">Time zone</Label>
                  <Input
                    id="timeZone"
                    value={TenantTimeZone.Bangladesh}
                    disabled
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={TenantCurrency.Bangladesh}
                    disabled
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        />
                      }
                    >
                      {language === TenantLanguage.Bangla
                        ? "Bangla"
                        : "English"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup
                        value={language}
                        onValueChange={(value) =>
                          setValue("language", value as FormInput["language"], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <DropdownMenuRadioItem value={TenantLanguage.English}>
                          English
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value={TenantLanguage.Bangla}>
                          Bangla
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {errors.language && (
                    <p className="text-sm text-destructive">
                      {errors.language.message}
                    </p>
                  )}
                </div>
                <input type="hidden" {...register("timeZone")} />
                <input type="hidden" {...register("currency")} />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={pending}>
                    {isNew ? "Create" : "Save"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {tenant && (
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Reason (required for impersonate; optional for suspend/close)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {tenant.status === TenantStatus.Active && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        actions.suspend.mutate(reason || undefined, { onError })
                      }
                    >
                      Suspend
                    </Button>
                  )}
                  {tenant.status === TenantStatus.Suspended && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        actions.reactivate.mutate(undefined, { onError })
                      }
                    >
                      Reactivate
                    </Button>
                  )}
                  {tenant.status !== TenantStatus.Closed && (
                    <Button
                      variant="destructive"
                      onClick={() =>
                        confirm("Close permanently?") &&
                        actions.close.mutate(reason || undefined, { onError })
                      }
                    >
                      Close
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() =>
                      actions.resetPassword.mutate(undefined, {
                        onSuccess: (result) =>
                          toast.success("Temporary password", {
                            description: result.temporaryPassword,
                            duration: 60000,
                          }),
                        onError,
                      })
                    }
                  >
                    Reset owner password
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!reason}
                    onClick={() =>
                      actions.impersonate.mutate(reason, {
                        onSuccess: (result) => {
                          navigator.clipboard.writeText(result.accessToken);
                          toast.success(
                            `Token for ${result.userName} copied (${result.expiresInSeconds}s)`,
                          );
                        },
                        onError,
                      })
                    }
                  >
                    Impersonate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {tenant && (
          <TabsContent value="subscriptions">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Record payment / change plan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={planId ?? ""}
                    onChange={(event) => setPlanId(Number(event.target.value))}
                  >
                    <option value="">Plan…</option>
                    {plans
                      ?.filter((plan) => plan.isActive)
                      .map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    className="w-24"
                    value={months}
                    onChange={(event) => setMonths(Number(event.target.value))}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Amount (optional)"
                    className="w-36"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                  <Input
                    placeholder="Payment ref (bKash/Nagad trx)"
                    className="w-64"
                    value={ref}
                    onChange={(event) => setRef(event.target.value)}
                  />
                  <Input
                    placeholder="Notes (optional)"
                    className="w-64"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                  <Button
                    disabled={!planId || record.isPending}
                    onClick={() =>
                      record.mutate(
                        {
                          planId: planId!,
                          months,
                          amount: amount ? Number(amount) : undefined,
                          paymentReference: ref || undefined,
                          notes: notes || undefined,
                        },
                        {
                          onSuccess: () => toast.success("Payment recorded"),
                          onError,
                        },
                      )
                    }
                  >
                    Record
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subs?.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>{subscription.planName}</TableCell>
                          <TableCell>
                            {fmtDate(subscription.startsAtUtc)} →{" "}
                            {fmtDate(subscription.endsAtUtc)}
                          </TableCell>
                          <TableCell>
                            {sourceLabel[subscription.source]}
                          </TableCell>
                          <TableCell>
                            {subscription.amount != null
                              ? `${subscription.currency} ${subscription.amount}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {subscription.paymentReference ?? "-"}
                          </TableCell>
                          <TableCell>{subscription.notes ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

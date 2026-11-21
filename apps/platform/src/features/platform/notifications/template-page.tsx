"use client";

import { useEffect } from "react";
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
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import {
  Channel,
  channelLabel,
  useTemplateMutations,
  useTemplates,
} from "./api";

const select = "h-9 w-full rounded-md border bg-background px-2 text-sm";

const schema = z
  .object({
    code: z.string().trim().min(1, "Required").max(100),
    channel: z.coerce.number(),
    language: z.string().trim().min(1, "Required").max(10),
    subject: z.string().trim().max(200).optional(),
    body: z.string().trim().min(1, "Required").max(4000),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.channel === Channel.Email && !v.subject)
      ctx.addIssue({
        code: "custom",
        path: ["subject"],
        message: "Email needs a subject",
      });
  });
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function TemplatePage({ id }: { id?: string }) {
  const isNew = !id;
  const router = useRouter();
  const can = useCan();
  const editable = can(Perm.NotificationManage);
  const { data: list, isLoading } = useTemplates();
  const template = list?.find((t) => String(t.id) === id);
  const m = useTemplateMutations();

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
      channel: Channel.Sms,
      language: "en",
      subject: "",
      body: "",
      isActive: true,
    },
  });
  const channel = Number(useWatch({ control, name: "channel" }));
  const body = useWatch({ control, name: "body" }) ?? "";
  const isActive = useWatch({ control, name: "isActive" });

  useEffect(() => {
    if (!template) return;
    reset({
      code: template.code,
      channel: template.channel,
      language: template.language,
      subject: template.subject ?? "",
      body: template.body,
      isActive: template.isActive,
    });
  }, [template, reset]);

  if (!isNew && isLoading) return <Spinner className="mx-auto mt-12 size-8" />;
  if (!isNew && !template) return null;

  const done = (msg: string) => {
    toast.success(msg);
    router.replace("/platform/notifications");
  };

  const submit = (v: FormValues) => {
    if (isNew) {
      m.create.mutate(
        {
          code: v.code,
          channel: v.channel,
          language: v.language,
          subject: v.channel === Channel.Email ? v.subject || null : null,
          body: v.body,
          description:
            list?.find((t) => t.code === v.code)?.description ?? null,
        },
        {
          onSuccess: () => done("Template added"),
          onError: (e) => applyProblem<FormInput>(e, setError),
        },
      );
    } else {
      m.update.mutate(
        {
          id: template!.id,
          body: {
            subject: v.channel === Channel.Email ? v.subject || null : null,
            body: v.body,
            isActive: v.isActive,
            rowVersion: template!.rowVersion,
          },
        },
        {
          onSuccess: () => done("Template saved"),
          onError: (e) => applyProblem<FormInput>(e, setError),
        },
      );
    }
  };

  return (
    <div className="space-y-4">
      {template && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <code className="text-base">{template.code}</code>
              <Badge variant="outline">{channelLabel[template.channel]}</Badge>
              <Badge variant="outline">{template.language}</Badge>
              <Badge variant={template.isActive ? "default" : "secondary"}>
                {template.isActive ? "On" : "Off"}
              </Badge>
            </CardTitle>
          </CardHeader>
          {template.description && (
            <CardContent className="text-sm">
              Placeholders: {template.description}
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isNew ? "New template version" : "Template details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <fieldset disabled={!editable} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="plan.expiry_reminder"
                    disabled={!isNew}
                    {...register("code")}
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">
                      {errors.code.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="channel">Channel</Label>
                  <select
                    id="channel"
                    className={select}
                    disabled={!isNew}
                    {...register("channel")}
                  >
                    <option value={Channel.Sms}>SMS</option>
                    <option value={Channel.Email}>Email</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    placeholder="bn, en"
                    disabled={!isNew}
                    {...register("language")}
                  />
                  {errors.language && (
                    <p className="text-sm text-destructive">
                      {errors.language.message}
                    </p>
                  )}
                </div>
                {channel === Channel.Email && (
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      maxLength={200}
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="body">Text</Label>
                  <textarea
                    id="body"
                    className="min-h-32 w-full rounded-md border bg-background p-2 text-sm"
                    maxLength={4000}
                    {...register("body")}
                  />
                  {errors.body && (
                    <p className="text-sm text-destructive">
                      {errors.body.message}
                    </p>
                  )}
                  {channel === Channel.Sms && (
                    <p className="text-xs text-muted-foreground">
                      {body.length} characters (one SMS ≈ 160 Latin / 70
                      Bangla).
                    </p>
                  )}
                </div>
                {!isNew && (
                  <label className="flex items-center gap-2 text-sm sm:col-span-3">
                    <Checkbox
                      checked={isActive}
                      onCheckedChange={(c) => setValue("isActive", c === true)}
                    />{" "}
                    Active
                  </label>
                )}
              </div>
            </fieldset>
            {editable && (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={m.create.isPending || m.update.isPending}
                >
                  {isNew ? "Add" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/platform/notifications")}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

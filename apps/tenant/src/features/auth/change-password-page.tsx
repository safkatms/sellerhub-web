"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useChangePassword } from "./api";
import { Field } from "./auth-form";
import { useActiveSession } from "./store";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(10, "Use at least 10 characters").max(200),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Choose a new password",
  });
type Form = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const router = useRouter();
  const { user, impersonating } = useActiveSession();
  const m = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  if (impersonating) {
    return (
      <p className="text-sm text-muted-foreground">
        Passwords cannot be changed while impersonating.
      </p>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        {user?.mustChangePassword && (
          <p className="text-sm text-muted-foreground">
            Your account has a temporary password. Choose a new one to continue.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(({ currentPassword, newPassword }) =>
            m.mutate(
              { currentPassword, newPassword },
              {
                onSuccess: () => {
                  reset();
                  toast.success("Password changed");
                  router.replace("/dashboard");
                },
                onError: (e) => applyProblem<Form>(e, setError),
              },
            ),
          )}
          className="space-y-4"
        >
          <Field
            id="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword}
            {...register("currentPassword")}
          />
          <Field
            id="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword}
            {...register("newPassword")}
          />
          <Field
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <Button type="submit" disabled={m.isPending}>
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

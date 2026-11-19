"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sellerhub/ui/components/button";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { applyProblem, getProblem } from "@sellerhub/api-client/errors";
import { useLogin } from "./api";
import { useAuthHydrated, useAuthStore } from "./store";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().trim().optional(),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.accessToken);
  const m = useLogin();
  // Set after the API says the password was right but a 2FA code is needed.
  const [needsCode, setNeedsCode] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  // Already signed in (or just signed in) -> go to the app.
  useEffect(() => {
    if (hydrated && token) router.replace("/platform/dashboard");
  }, [hydrated, token, router]);

  const submit = (v: Form) =>
    m.mutate(
      { email: v.email, password: v.password, totpCode: needsCode ? v.totpCode || undefined : undefined },
      {
        onError: (e) => {
          if (getProblem(e)?.code === "two_factor_required") {
            setNeedsCode(true);
            return;
          }
          applyProblem<Form>(e, setError);
        },
      },
    );

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>SellerHub Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" readOnly={needsCode} {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" readOnly={needsCode} {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {needsCode && (
              <div className="space-y-1.5">
                <Label htmlFor="totpCode">Authentication code</Label>
                <Input id="totpCode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
                  placeholder="6-digit code from your app" {...register("totpCode")} />
                {errors.totpCode && (
                  <p className="text-sm text-destructive">{errors.totpCode.message}</p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={m.isPending}>
              {needsCode ? "Verify" : "Sign in"}
            </Button>
            {needsCode && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => setNeedsCode(false)}>
                Use a different account
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

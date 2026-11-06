"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sellerhub/ui/components/button";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useLogin } from "./api";
import { AuthCard, Field } from "./auth-form";
import { useActiveSession, useAuthHydrated } from "./store";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or phone"),
  password: z.string().min(1, "Password is required"),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const { token } = useActiveSession();
  const m = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  // Already signed in (or just signed in) -> go to the app.
  useEffect(() => {
    if (hydrated && token) router.replace("/dashboard");
  }, [hydrated, token, router]);

  return (
    <AuthCard title="Sign in to SellerHub">
      <form
        onSubmit={handleSubmit((v) => m.mutate(v, { onError: (e) => applyProblem<Form>(e, setError) }))}
        className="space-y-4"
      >
        <Field
          id="identifier"
          label="Email or phone"
          autoComplete="username"
          error={errors.identifier}
          {...register("identifier")}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          {...register("password")}
        />
        <Button type="submit" className="w-full" disabled={m.isPending}>
          Sign in
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New to SellerHub?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Create your shop
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

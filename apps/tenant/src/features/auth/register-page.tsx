"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sellerhub/ui/components/button";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useRegister } from "./api";
import { AuthCard, Field } from "./auth-form";
import { useActiveSession, useAuthHydrated } from "./store";

// Mirrors TenantRegisterValidator on the API; the API stays the source of truth.
const schema = z
  .object({
    shopName: z.string().trim().min(1, "Shop name is required").max(200),
    ownerName: z.string().trim().min(1, "Your name is required").max(200),
    email: z.union([
      z.literal(""),
      z.string().trim().email("Enter a valid email"),
    ]),
    phone: z.string().trim().max(32),
    password: z.string().min(10, "Use at least 10 characters").max(200),
    confirmPassword: z.string(),
  })
  .refine((v) => v.email || v.phone, {
    path: ["email"],
    message: "Enter an email or a phone number",
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const { token } = useActiveSession();
  const m = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      shopName: "",
      ownerName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (hydrated && token) router.replace("/dashboard");
  }, [hydrated, token, router]);

  return (
    <AuthCard title="Create your shop">
      <form
        onSubmit={handleSubmit((v) =>
          m.mutate(
            {
              shopName: v.shopName,
              ownerName: v.ownerName,
              email: v.email || undefined,
              phone: v.phone || undefined,
              password: v.password,
            },
            { onError: (e) => applyProblem<Form>(e, setError) },
          ),
        )}
        className="space-y-4"
      >
        <Field
          id="shopName"
          label="Shop name"
          error={errors.shopName}
          {...register("shopName")}
        />
        <Field
          id="ownerName"
          label="Your name"
          autoComplete="name"
          error={errors.ownerName}
          {...register("ownerName")}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register("email")}
        />
        <Field
          id="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone}
          {...register("phone")}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password}
          {...register("password")}
        />
        <Field
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" disabled={m.isPending}>
          Create shop
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have a shop?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

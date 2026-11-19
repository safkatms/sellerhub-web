"use client";
import { useState } from "react";
import type { FieldError } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";

/** Centered card shared by the sign-in and registration screens. */
export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}

/**
 * Label + input + validation message. Spread react-hook-form's `register(...)` into it.
 * A `type="password"` field gets a show/hide toggle.
 */
export function Field({
  id,
  label,
  error,
  type,
  className,
  ...input
}: { id: string; label: string; error?: FieldError } & React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={Boolean(error)}
          type={isPassword && visible ? "text" : type}
          className={isPassword ? `pr-10 ${className ?? ""}` : className}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

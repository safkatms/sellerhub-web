"use client";
import type { FieldError } from "react-hook-form";
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

/** Label + input + validation message. Spread react-hook-form's `register(...)` into it. */
export function Field({
  id,
  label,
  error,
  ...input
}: { id: string; label: string; error?: FieldError } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={Boolean(error)} {...input} />
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

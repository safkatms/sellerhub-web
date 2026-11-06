"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { DataTable } from "@sellerhub/ui/data-table";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { useLocalTable, type SortAccessors } from "@sellerhub/ui/hooks/use-local-table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useAdmins, useCreateAdmin, useToggleAdmin, type AdminItem } from "./api";
import { adminColumns } from "./columns";

const schema = z.object({
  fullName: z.string().min(1, "Required").max(200),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type Form = z.infer<typeof schema>;

const sortBy: SortAccessors<AdminItem> = {
  fullName: (a) => a.fullName,
  email: (a) => a.email,
  status: (a) => a.status,
  lastLoginAtUtc: (a) => a.lastLoginAtUtc,
};

export function AdminsPage() {
  const { data, isLoading } = useAdmins();
  const create = useCreateAdmin();
  const toggle = useToggleAdmin();
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "fullName", desc: false }],
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const submit = (value: Form) =>
    create.mutate(value, {
      onSuccess: () => {
        reset();
        toast.success("Admin created");
      },
      onError: (error) => applyProblem<Form>(error, setError),
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>New admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(submit)}
            className="grid items-start gap-4 sm:grid-cols-4"
          >
            {(
              [
                ["fullName", "Full name", "text"],
                ["email", "Email", "email"],
                ["password", "Initial password", "password"],
              ] as const
            ).map(([name, label, type]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} type={type} {...register(name)} />
                {errors[name] && (
                  <p className="text-sm text-destructive">
                    {errors[name]?.message}
                  </p>
                )}
              </div>
            ))}
            <Button
              type="submit"
              className="sm:mt-6"
              disabled={create.isPending}
            >
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        columns={adminColumns(toggle, (error) => applyProblem(error))}
        loading={isLoading}
        {...table}
      />
    </div>
  );
}

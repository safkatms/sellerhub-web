"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdmins,
  useCreateAdmin,
  useToggleAdmin,
} from "@/features/admins/api";
import { adminColumns } from "@/features/admins/columns";
import { applyProblem } from "@/lib/api/errors";
import { toast } from "sonner";

const schema = z.object({
  fullName: z.string().min(1, "Required").max(200),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
type Form = z.infer<typeof schema>;

export default function AdminsPage() {
  const { data, isLoading } = useAdmins();
  const create = useCreateAdmin();
  const toggle = useToggleAdmin();
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fullName", desc: false },
  ]);
  const pageSize = 10;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const sortedAdmins = useMemo(() => {
    const items = [...(data ?? [])];
    const sort = sorting[0];
    if (!sort) return items;

    return items.sort((a, b) => {
      const left =
        sort.id === "email"
          ? a.email
          : sort.id === "status"
            ? a.status
            : sort.id === "lastLoginAtUtc"
              ? (a.lastLoginAtUtc ?? "")
              : a.fullName;
      const right =
        sort.id === "email"
          ? b.email
          : sort.id === "status"
            ? b.status
            : sort.id === "lastLoginAtUtc"
              ? (b.lastLoginAtUtc ?? "")
              : b.fullName;
      return (
        (typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right))) * (sort.desc ? -1 : 1)
      );
    });
  }, [data, sorting]);

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
        data={sortedAdmins.slice((page - 1) * pageSize, page * pageSize)}
        loading={isLoading}
        total={sortedAdmins.length}
        page={page}
        pageSize={pageSize}
        sorting={sorting}
        onPageChange={setPage}
        onSortingChange={(nextSorting) => {
          setSorting(nextSorting);
          setPage(1);
        }}
      />
    </div>
  );
}

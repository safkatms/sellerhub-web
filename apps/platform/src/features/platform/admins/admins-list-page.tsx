"use client";

import Link from "next/link";
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import {
  useLocalTable,
  type SortAccessors,
} from "@sellerhub/ui/hooks/use-local-table";
import { Perm, useCan } from "@/features/platform/roles/api";
import { useAdmins, type AdminItem } from "./api";
import { adminColumns } from "./columns";

const sortBy: SortAccessors<AdminItem> = {
  fullName: (a) => a.fullName,
  email: (a) => a.email,
  status: (a) => a.status,
  lastLoginAtUtc: (a) => a.lastLoginAtUtc,
};

export function AdminsListPage() {
  const can = useCan();
  const { data, isLoading } = useAdmins();
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "fullName", desc: false }],
  });

  return (
    <div className="space-y-4">
      {can(Perm.AdminManage) && (
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={<Link href="/platform/admins/new" />}
          >
            New admin
          </Button>
        </div>
      )}
      <DataTable columns={adminColumns} loading={isLoading} {...table} />
    </div>
  );
}

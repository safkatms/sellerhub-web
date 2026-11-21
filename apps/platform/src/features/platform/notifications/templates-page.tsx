"use client";

import Link from "next/link";
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import {
  useLocalTable,
  type SortAccessors,
} from "@sellerhub/ui/hooks/use-local-table";
import { Perm, useCan } from "@/features/platform/roles/api";
import { channelLabel, useTemplates, type Template } from "./api";
import { templateColumns } from "./columns";

const sortBy: SortAccessors<Template> = {
  code: (t) => t.code,
  channel: (t) => channelLabel[t.channel],
  language: (t) => t.language,
  status: (t) => (t.isActive ? 1 : 0),
};

export function TemplatesPage() {
  const can = useCan();
  const { data, isLoading } = useTemplates();
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "code", desc: false }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {
            "Use {{Placeholder}} tokens; each template lists the ones it gets. A shop gets its own language, else English."
          }
        </p>
        {can(Perm.NotificationManage) && (
          <Button
            nativeButton={false}
            render={<Link href="/platform/notifications/templates/new" />}
          >
            New template
          </Button>
        )}
      </div>
      <DataTable columns={templateColumns} loading={isLoading} {...table} />
    </div>
  );
}

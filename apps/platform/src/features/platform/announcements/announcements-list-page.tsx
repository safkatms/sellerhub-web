"use client";

import Link from "next/link";
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import {
  useLocalTable,
  type SortAccessors,
} from "@sellerhub/ui/hooks/use-local-table";
import { Perm, useCan } from "@/features/platform/roles/api";
import { useAnnouncements, type Announcement } from "./api";
import { announcementColumns, audienceOf, statusOf } from "./columns";

const sortBy: SortAccessors<Announcement> = {
  title: (a) => a.title,
  audience: (a) => audienceOf(a),
  startsAtUtc: (a) => a.startsAtUtc,
  status: (a) => statusOf(a),
  dismissCount: (a) => a.dismissCount,
};

export function AnnouncementsListPage() {
  const can = useCan();
  const { data, isLoading } = useAnnouncements();
  const table = useLocalTable(data, {
    sortBy,
    initialSorting: [{ id: "startsAtUtc", desc: true }],
  });

  return (
    <div className="space-y-4">
      {can(Perm.AnnouncementManage) && (
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={<Link href="/platform/announcements/new" />}
          >
            New announcement
          </Button>
        </div>
      )}
      <DataTable columns={announcementColumns} loading={isLoading} {...table} />
    </div>
  );
}

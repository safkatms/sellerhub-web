"use client";

import { useState } from "react";
import { Button } from "@sellerhub/ui/components/button";
import { Input } from "@sellerhub/ui/components/input";
import { DataTable } from "@sellerhub/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@sellerhub/ui/components/dropdown-menu";
import { useLoginLogs, type LoginLog } from "./api";
import { loginColumns } from "./columns";
import { LoginLogDialog } from "./log-details";

const pageSize = 20;

export function LoginLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | undefined>();
  const [selected, setSelected] = useState<LoginLog | null>(null);
  const { data, isLoading } = useLoginLogs({
    page,
    pageSize,
    search: search || undefined,
    isSuccess,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-xs"
          value={search}
          placeholder="Search email/phone…"
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            {isSuccess === undefined
              ? "All results"
              : isSuccess
                ? "Success"
                : "Failed"}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={isSuccess === undefined ? "all" : String(isSuccess)}
              onValueChange={(value) => {
                setIsSuccess(value === "all" ? undefined : value === "true");
                setPage(1);
              }}
            >
              <DropdownMenuRadioItem value="all">
                All results
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="true">
                Success
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="false">
                Failed
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DataTable
        columns={loginColumns(setSelected)}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        sorting={[]}
        onPageChange={setPage}
        onSortingChange={() => {}}
      />
      <LoginLogDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

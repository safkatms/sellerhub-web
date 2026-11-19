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
import {
  useAuditLogs,
  useLoginLogs,
  useErrorLogs,
  useImpersonationLogs,
  type AuditLog,
  type LoginLog,
} from "./api";
import { auditColumns, errorColumns, impersonationColumns, loginColumns } from "./columns";
import { AuditLogDialog, ErrorLogDialog, LoginLogDialog } from "./log-details";

type Tab = "audit" | "logins" | "errors" | "impersonations";
const tabs: { id: Tab; label: string; placeholder: string }[] = [
  { id: "audit", label: "Audit", placeholder: "Search action…" },
  { id: "logins", label: "Logins", placeholder: "Search email/phone…" },
  { id: "errors", label: "Errors", placeholder: "Search path/message…" },
  { id: "impersonations", label: "Login as shop", placeholder: "Search reason…" },
];
const pageSize = 20;

export function LogsPage() {
  const [tab, setTab] = useState<Tab>("audit");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | undefined>();
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [selectedLogin, setSelectedLogin] = useState<LoginLog | null>(null);
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);

  // Only the visible tab's query is enabled.
  const q = { page, pageSize, search: search || undefined };
  const audit = useAuditLogs(q, tab === "audit");
  const logins = useLoginLogs({ ...q, isSuccess }, tab === "logins");
  const errors = useErrorLogs(q, tab === "errors");
  const impersonations = useImpersonationLogs(q, tab === "impersonations");

  const switchTab = (t: Tab) => {
    setTab(t);
    setPage(1);
    setSearch("");
    setIsSuccess(undefined);
  };
  const paging = {
    page,
    pageSize,
    sorting: [],
    onPageChange: setPage,
    onSortingChange: () => {},
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
        <Input
          className="max-w-xs"
          value={search}
          placeholder={tabs.find((t) => t.id === tab)?.placeholder}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {tab === "logins" && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
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
        )}
      </div>

      {tab === "audit" && (
        <DataTable
          columns={auditColumns(setSelectedAudit)}
          data={audit.data?.items ?? []}
          loading={audit.isLoading}
          total={audit.data?.totalCount ?? 0}
          {...paging}
        />
      )}
      {tab === "logins" && (
        <DataTable
          columns={loginColumns(setSelectedLogin)}
          data={logins.data?.items ?? []}
          loading={logins.isLoading}
          total={logins.data?.totalCount ?? 0}
          {...paging}
        />
      )}
      {tab === "errors" && (
        <DataTable
          columns={errorColumns(setSelectedErrorId)}
          data={errors.data?.items ?? []}
          loading={errors.isLoading}
          total={errors.data?.totalCount ?? 0}
          {...paging}
        />
      )}

      {tab === "impersonations" && (
        <DataTable
          columns={impersonationColumns()}
          data={impersonations.data?.items ?? []}
          loading={impersonations.isLoading}
          total={impersonations.data?.totalCount ?? 0}
          {...paging}
        />
      )}

      <AuditLogDialog log={selectedAudit} onClose={() => setSelectedAudit(null)} />
      <LoginLogDialog log={selectedLogin} onClose={() => setSelectedLogin(null)} />
      <ErrorLogDialog id={selectedErrorId} onClose={() => setSelectedErrorId(null)} />
    </div>
  );
}

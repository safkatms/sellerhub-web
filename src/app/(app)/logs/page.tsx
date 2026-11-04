"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAuditLogs,
  useErrorLog,
  useLoginLogs,
  useErrorLogs,
  type AuditLog,
  type LoginLog,
} from "@/features/logs/api";
import {
  auditColumns,
  errorColumns,
  loginColumns,
} from "@/features/logs/columns";

type Tab = "audit" | "logins" | "errors";
const pageSize = 20;

export default function LogsPage() {
  const [tab, setTab] = useState<Tab>("audit");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | undefined>();
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [selectedLogin, setSelectedLogin] = useState<LoginLog | null>(null);
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const { data: selectedError } = useErrorLog(selectedErrorId);

  const q = { page, pageSize, search: search || undefined };
  const audit = useAuditLogs(tab === "audit" ? q : { page: 1, pageSize: 1 });
  const logins = useLoginLogs(
    tab === "logins" ? { ...q, isSuccess } : { page: 1, pageSize: 1 },
  );
  const errors = useErrorLogs(tab === "errors" ? q : { page: 1, pageSize: 1 });

  const switchTab = (t: Tab) => {
    setTab(t);
    setPage(1);
    setSearch("");
    setIsSuccess(undefined);
  };
  const common = {
    total: 0,
    page,
    pageSize,
    sorting: [],
    onPageChange: setPage,
    onSortingChange: () => {},
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["audit", "logins", "errors"] as Tab[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => switchTab(t)}
          >
            {t === "audit" ? "Audit" : t === "logins" ? "Logins" : "Errors"}
          </Button>
        ))}
        <Input
          className="max-w-xs"
          value={search}
          placeholder={
            tab === "audit"
              ? "Search action…"
              : tab === "logins"
                ? "Search email/phone…"
                : "Search path/message…"
          }
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {tab === "logins" && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" />
              }
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
          {...common}
          total={audit.data?.totalCount ?? 0}
        />
      )}
      {tab === "logins" && (
        <DataTable
          columns={loginColumns(setSelectedLogin)}
          data={logins.data?.items ?? []}
          loading={logins.isLoading}
          {...common}
          total={logins.data?.totalCount ?? 0}
        />
      )}
      {tab === "errors" && (
        <DataTable
          columns={errorColumns(setSelectedErrorId)}
          data={errors.data?.items ?? []}
          loading={errors.isLoading}
          {...common}
          total={errors.data?.totalCount ?? 0}
        />
      )}
      <Dialog
        open={selectedAudit !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAudit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit log details</DialogTitle>
            <DialogDescription>
              {selectedAudit
                ? `Audit #${selectedAudit.id} · ${selectedAudit.action}`
                : "Loading audit details..."}
            </DialogDescription>
          </DialogHeader>
          {selectedAudit && (
            <div className="max-h-[70vh] space-y-3 overflow-auto text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div><dt className="font-medium text-muted-foreground">ID</dt><dd>{selectedAudit.id}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Created</dt><dd>{selectedAudit.createdAtUtc}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Action</dt><dd>{selectedAudit.action}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Entity</dt><dd>{selectedAudit.entityName ?? "-"}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Entity ID</dt><dd className="break-all">{selectedAudit.entityId ?? "-"}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Tenant ID</dt><dd className="break-all">{selectedAudit.tenantId ?? "-"}</dd></div>
                <div><dt className="font-medium text-muted-foreground">User ID</dt><dd className="break-all">{selectedAudit.userId ?? "-"}</dd></div>
                <div><dt className="font-medium text-muted-foreground">IP</dt><dd>{selectedAudit.ipAddress ?? "-"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-medium text-muted-foreground">Correlation ID</dt><dd className="break-all font-mono text-xs">{selectedAudit.correlationId ?? "-"}</dd></div>
              </dl>
              <div><p className="font-medium text-muted-foreground">Old values</p><pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{selectedAudit.oldValues ?? "-"}</pre></div>
              <div><p className="font-medium text-muted-foreground">New values</p><pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{selectedAudit.newValues ?? "-"}</pre></div>
            </div>
          )}
          <DialogFooter><DialogClose render={<Button variant="outline" />}>Close</DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={selectedLogin !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLogin(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login log details</DialogTitle>
            <DialogDescription>
              {selectedLogin
                ? `Login #${selectedLogin.id} · ${selectedLogin.identifier}`
                : "Loading login details..."}
            </DialogDescription>
          </DialogHeader>
          {selectedLogin && (
            <div className="max-h-[70vh] space-y-3 overflow-auto text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div><dt className="font-medium text-muted-foreground">ID</dt><dd>{selectedLogin.id}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Created</dt><dd>{selectedLogin.createdAtUtc}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Identifier</dt><dd>{selectedLogin.identifier}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Result</dt><dd>{selectedLogin.isSuccess ? "Success" : "Failed"}</dd></div>
                <div><dt className="font-medium text-muted-foreground">Tenant ID</dt><dd className="break-all">{selectedLogin.tenantId ?? "-"}</dd></div>
                <div><dt className="font-medium text-muted-foreground">User ID</dt><dd className="break-all">{selectedLogin.userId ?? "-"}</dd></div>
                <div><dt className="font-medium text-muted-foreground">IP</dt><dd>{selectedLogin.ipAddress ?? "-"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-medium text-muted-foreground">Correlation ID</dt><dd className="break-all font-mono text-xs">{selectedLogin.correlationId ?? "-"}</dd></div>
              </dl>
              <div><p className="font-medium text-muted-foreground">Failure reason</p><pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{selectedLogin.failureReason ?? "-"}</pre></div>
              <div><p className="font-medium text-muted-foreground">User agent</p><pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{selectedLogin.userAgent ?? "-"}</pre></div>
            </div>
          )}
          <DialogFooter><DialogClose render={<Button variant="outline" />}>Close</DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={selectedErrorId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedErrorId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error details</DialogTitle>
            <DialogDescription>
              {selectedError
                ? `Error #${selectedError.id} · ${selectedError.traceId}`
                : "Loading error details..."}
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="max-h-[70vh] space-y-3 overflow-auto text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-muted-foreground">ID</dt>
                  <dd>{selectedError.id}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Trace ID</dt>
                  <dd className="break-all font-mono text-xs">
                    {selectedError.traceId}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Tenant ID
                  </dt>
                  <dd className="break-all">{selectedError.tenantId ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">User ID</dt>
                  <dd className="break-all">{selectedError.userId ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Method</dt>
                  <dd>{selectedError.httpMethod ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Status</dt>
                  <dd>{selectedError.statusCode ?? "-"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-muted-foreground">Path</dt>
                  <dd className="break-all">{selectedError.path ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Error code
                  </dt>
                  <dd>{selectedError.errorCode ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">
                    Created
                  </dt>
                  <dd>{selectedError.createdAtUtc}</dd>
                </div>
              </dl>
              <div>
                <p className="font-medium text-muted-foreground">Message</p>
                <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">
                  {selectedError.message ?? "-"}
                </pre>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Details</p>
                <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">
                  {selectedError.details ?? "-"}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

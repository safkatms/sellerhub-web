"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/dayjs";
import { useErrorLog, type AuditLog, type LoginLog } from "./api";

function Field({
  label,
  children,
  wide,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("break-all", mono && "font-mono text-xs")}>
        {children ?? "-"}
      </dd>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground">{label}</p>
      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">
        {value ?? "-"}
      </pre>
    </div>
  );
}

function LogDialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children && (
          <div className="max-h-[70vh] space-y-3 overflow-auto text-sm">
            {children}
          </div>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogDialog({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  return (
    <LogDialog
      open={log !== null}
      onClose={onClose}
      title="Audit log details"
      description={log ? `Audit #${log.id} · ${log.action}` : "Loading audit details..."}
    >
      {log && (
        <>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="ID">{log.id}</Field>
            <Field label="Created">{fmtDate(log.createdAtUtc)}</Field>
            <Field label="Action">{log.action}</Field>
            <Field label="Entity">{log.entityName}</Field>
            <Field label="Entity ID">{log.entityId}</Field>
            <Field label="Tenant ID">{log.tenantId}</Field>
            <Field label="User ID">{log.userId}</Field>
            <Field label="IP">{log.ipAddress}</Field>
            <Field label="Correlation ID" wide mono>
              {log.correlationId}
            </Field>
          </dl>
          <Block label="Old values" value={log.oldValues} />
          <Block label="New values" value={log.newValues} />
        </>
      )}
    </LogDialog>
  );
}

export function LoginLogDialog({
  log,
  onClose,
}: {
  log: LoginLog | null;
  onClose: () => void;
}) {
  return (
    <LogDialog
      open={log !== null}
      onClose={onClose}
      title="Login log details"
      description={log ? `Login #${log.id} · ${log.identifier}` : "Loading login details..."}
    >
      {log && (
        <>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="ID">{log.id}</Field>
            <Field label="Created">{fmtDate(log.createdAtUtc)}</Field>
            <Field label="Identifier">{log.identifier}</Field>
            <Field label="Result">{log.isSuccess ? "Success" : "Failed"}</Field>
            <Field label="Tenant ID">{log.tenantId}</Field>
            <Field label="User ID">{log.userId}</Field>
            <Field label="Device">{log.deviceName}</Field>
            <Field label="IP">{log.ipAddress}</Field>
            <Field label="Correlation ID" wide mono>
              {log.correlationId}
            </Field>
          </dl>
          <Block label="Failure reason" value={log.failureReason} />
          <Block label="User agent" value={log.userAgent} />
        </>
      )}
    </LogDialog>
  );
}

/** Fetches the full error (including details) on demand. */
export function ErrorLogDialog({
  id,
  onClose,
}: {
  id: number | null;
  onClose: () => void;
}) {
  const { data: log } = useErrorLog(id);
  return (
    <LogDialog
      open={id !== null}
      onClose={onClose}
      title="Error details"
      description={log ? `Error #${log.id} · ${log.traceId}` : "Loading error details..."}
    >
      {log && (
        <>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="ID">{log.id}</Field>
            <Field label="Trace ID" mono>
              {log.traceId}
            </Field>
            <Field label="Tenant ID">{log.tenantId}</Field>
            <Field label="User ID">{log.userId}</Field>
            <Field label="Method">{log.httpMethod}</Field>
            <Field label="Status">{log.statusCode}</Field>
            <Field label="Path" wide>
              {log.path}
            </Field>
            <Field label="Error code">{log.errorCode}</Field>
            <Field label="Created">{fmtDate(log.createdAtUtc)}</Field>
          </dl>
          <Block label="Message" value={log.message} />
          <Block label="Details" value={log.details} />
        </>
      )}
    </LogDialog>
  );
}

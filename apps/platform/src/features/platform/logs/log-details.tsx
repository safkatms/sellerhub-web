"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sellerhub/ui/components/dialog";
import { cn } from "@sellerhub/ui/lib/utils";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { useErrorLog, type AuditLog, type LoginLog } from "./api";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for non-secure contexts or blocked clipboard access.
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

function CopyButton({
  value,
  label,
  className,
}: {
  value: string | null | undefined;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      onClick={async () => {
        await copyToClipboard(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Plain-text export of label/value rows; empty values are skipped. */
const toText = (rows: [string, unknown][]) =>
  rows
    .filter(([, v]) => text(v) !== "")
    .map(([k, v]) => `${k}: ${text(v)}`)
    .join("\n");

function Field({
  label,
  children,
  copy,
  wide,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  /** Raw value to copy; omit to hide the copy button. */
  copy?: string | number | null;
  wide?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="flex items-center gap-1 font-medium text-muted-foreground">
        {label}
        <CopyButton value={text(copy)} label={label} />
      </dt>
      <dd className={cn("break-all", mono && "font-mono text-xs")}>
        {children ?? "-"}
      </dd>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="flex items-center gap-1 font-medium text-muted-foreground">
        {label}
        <CopyButton value={value} label={label} />
      </p>
      <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-3 text-xs break-words whitespace-pre-wrap">
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
  copyAll,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Text copied by the "Copy all" button; hidden when empty. */
  copyAll?: string;
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
          {copyAll && (
            <Button
              variant="outline"
              onClick={async () => {
                await copyToClipboard(copyAll);
                toast.success("Copied");
              }}
            >
              <Copy /> Copy all
            </Button>
          )}
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
      description={
        log ? `Audit #${log.id} · ${log.action}` : "Loading audit details..."
      }
      copyAll={
        log
          ? toText([
              ["ID", log.id],
              ["Created", fmtDate(log.createdAtUtc)],
              ["Action", log.action],
              ["Entity", log.entityName],
              ["Entity ID", log.entityId],
              ["Tenant ID", log.tenantId],
              ["User ID", log.userId],
              ["IP", log.ipAddress],
              ["Correlation ID", log.correlationId],
              ["Old values", log.oldValues],
              ["New values", log.newValues],
            ])
          : undefined
      }
    >
      {log && (
        <>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="ID" copy={log.id}>
              {log.id}
            </Field>
            <Field label="Created" copy={fmtDate(log.createdAtUtc)}>
              {fmtDate(log.createdAtUtc)}
            </Field>
            <Field label="Action" copy={log.action}>
              {log.action}
            </Field>
            <Field label="Entity" copy={log.entityName}>
              {log.entityName}
            </Field>
            <Field label="Entity ID" copy={log.entityId}>
              {log.entityId}
            </Field>
            <Field label="Tenant ID" copy={log.tenantId}>
              {log.tenantId}
            </Field>
            <Field label="User ID" copy={log.userId}>
              {log.userId}
            </Field>
            <Field label="IP" copy={log.ipAddress}>
              {log.ipAddress}
            </Field>
            <Field label="Correlation ID" copy={log.correlationId} wide mono>
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
      description={
        log
          ? `Login #${log.id} · ${log.identifier}`
          : "Loading login details..."
      }
      copyAll={
        log
          ? toText([
              ["ID", log.id],
              ["Created", fmtDate(log.createdAtUtc)],
              ["Identifier", log.identifier],
              ["Result", log.isSuccess ? "Success" : "Failed"],
              ["Tenant ID", log.tenantId],
              ["User ID", log.userId],
              ["Device", log.deviceName],
              ["IP", log.ipAddress],
              ["Correlation ID", log.correlationId],
              ["Failure reason", log.failureReason],
              ["User agent", log.userAgent],
            ])
          : undefined
      }
    >
      {log && (
        <>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="ID" copy={log.id}>
              {log.id}
            </Field>
            <Field label="Created" copy={fmtDate(log.createdAtUtc)}>
              {fmtDate(log.createdAtUtc)}
            </Field>
            <Field label="Identifier" copy={log.identifier}>
              {log.identifier}
            </Field>
            <Field label="Result">{log.isSuccess ? "Success" : "Failed"}</Field>
            <Field label="Tenant ID" copy={log.tenantId}>
              {log.tenantId}
            </Field>
            <Field label="User ID" copy={log.userId}>
              {log.userId}
            </Field>
            <Field label="Device" copy={log.deviceName}>
              {log.deviceName}
            </Field>
            <Field label="IP" copy={log.ipAddress}>
              {log.ipAddress}
            </Field>
            <Field label="Correlation ID" copy={log.correlationId} wide mono>
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
      description={
        log ? `Error #${log.id} · ${log.traceId}` : "Loading error details..."
      }
      copyAll={
        log
          ? toText([
              ["ID", log.id],
              ["Trace ID", log.traceId],
              ["Created", fmtDate(log.createdAtUtc)],
              ["Tenant ID", log.tenantId],
              ["User ID", log.userId],
              ["Method", log.httpMethod],
              ["Path", log.path],
              ["Status", log.statusCode],
              ["Error code", log.errorCode],
              ["Message", log.message],
              ["Details", log.details],
            ])
          : undefined
      }
    >
      {log && (
        <>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="ID" copy={log.id}>
              {log.id}
            </Field>
            <Field label="Trace ID" copy={log.traceId} mono>
              {log.traceId}
            </Field>
            <Field label="Tenant ID" copy={log.tenantId}>
              {log.tenantId}
            </Field>
            <Field label="User ID" copy={log.userId}>
              {log.userId}
            </Field>
            <Field label="Method" copy={log.httpMethod}>
              {log.httpMethod}
            </Field>
            <Field label="Status" copy={log.statusCode}>
              {log.statusCode}
            </Field>
            <Field label="Path" copy={log.path} wide>
              {log.path}
            </Field>
            <Field label="Error code" copy={log.errorCode}>
              {log.errorCode}
            </Field>
            <Field label="Created" copy={fmtDate(log.createdAtUtc)}>
              {fmtDate(log.createdAtUtc)}
            </Field>
          </dl>
          <Block label="Message" value={log.message} />
          <Block label="Details" value={log.details} />
        </>
      )}
    </LogDialog>
  );
}

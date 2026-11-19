"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sellerhub/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sellerhub/ui/components/tabs";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/access/api";
import { Pager } from "@/components/pager";
import {
  DataRequestKind, DataRequestStatus, JobStatus, dataKindLabel, dataStatusLabel, jobStatusLabel,
  useDataRequestMutations, useDataRequests, useJobRunDetails, useJobRuns, useJobs, useRunJob, type DataRequestItem,
} from "./api";

const select = "h-9 rounded-md border bg-background px-2 text-sm";

export function OpsPage() {
  const [tab, setTab] = useState("data");
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="space-y-4">
      <TabsList variant="line">
        <TabsTrigger value="data">Data requests</TabsTrigger>
        <TabsTrigger value="jobs">Background jobs</TabsTrigger>
      </TabsList>
      <TabsContent value="data"><DataRequestsTab /></TabsContent>
      <TabsContent value="jobs"><JobsTab enabled={tab === "jobs"} /></TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------- data requests

function DataRequestsTab() {
  const can = useCan();
  const [status, setStatus] = useState<number | undefined>(DataRequestStatus.Pending);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDataRequests({ page, pageSize: 20, status });
  const m = useDataRequestMutations();
  const [dialog, setDialog] = useState<{ item: DataRequestItem; status: number } | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const editable = can(Perm.OpsManage);

  const open = (item: DataRequestItem, s: number) => { setUrl(item.resultUrl ?? ""); setNote(""); setDialog({ item, status: s }); };
  const purgeDue = (r: DataRequestItem) => r.scheduledPurgeAtUtc && !r.purgedAtUtc && new Date(r.scheduledPurgeAtUtc) <= new Date();

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <select className={select} value={status ?? ""} onChange={(e) => { setStatus(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}>
          <option value="">All statuses</option>
          {Object.entries(dataStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {isLoading ? <Spinner className="mx-auto size-6" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Requested</TableHead><TableHead>Shop</TableHead><TableHead>Kind</TableHead><TableHead>Status</TableHead>
              <TableHead>Result</TableHead><TableHead className="text-right" />
            </TableRow></TableHeader>
            <TableBody>
              {data?.items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{fmtDate(r.requestedAtUtc)}</TableCell>
                  <TableCell><Link className="underline" href={`/platform/tenants/${r.tenantId}`}>{r.tenantName}</Link>
                    {r.reason && <div className="max-w-56 truncate text-xs text-muted-foreground" title={r.reason}>“{r.reason}”</div>}</TableCell>
                  <TableCell><Badge variant={r.kind === DataRequestKind.Delete ? "destructive" : "outline"}>{dataKindLabel[r.kind]}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{dataStatusLabel[r.status]}</Badge>
                    {r.adminNote && <div className="max-w-48 truncate text-xs text-muted-foreground" title={r.adminNote}>{r.adminNote}</div>}</TableCell>
                  <TableCell className="text-xs">
                    {r.resultUrl && <a className="underline" href={r.resultUrl} target="_blank" rel="noreferrer">Download link</a>}
                    {r.scheduledPurgeAtUtc && <div>Purge after {fmtDate(r.scheduledPurgeAtUtc)}</div>}
                    {r.purgedAtUtc && <div>Purged {fmtDate(r.purgedAtUtc)}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable && (r.status === DataRequestStatus.Pending || r.status === DataRequestStatus.Processing) && (
                      <div className="flex justify-end gap-2">
                        {r.status === DataRequestStatus.Pending && <Button size="sm" variant="outline" onClick={() => open(r, DataRequestStatus.Processing)}>Start</Button>}
                        <Button size="sm" onClick={() => open(r, DataRequestStatus.Completed)}>{r.kind === DataRequestKind.Delete ? "Approve" : "Complete"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => open(r, DataRequestStatus.Rejected)}>Reject</Button>
                      </div>
                    )}
                    {editable && purgeDue(r) && (
                      <Button size="sm" variant="destructive" onClick={() => confirm("Confirm the shop's data was purged by a DBA. This only records it.") &&
                        m.markPurged.mutate(r.id, { onSuccess: () => toast.success("Recorded"), onError: (e) => applyProblem(e) })}>Mark purged</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No requests.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
        <Pager page={page} pageSize={20} total={data?.totalCount ?? 0} onPage={setPage} />
      </CardContent>

      <Dialog open={Boolean(dialog)} onOpenChange={(o) => { if (!o) setDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog && `${dataStatusLabel[dialog.status]}: ${dataKindLabel[dialog.item.kind]} for ${dialog.item.tenantName}`}</DialogTitle>
            <DialogDescription>
              {dialog?.status === DataRequestStatus.Completed && dialog.item.kind === DataRequestKind.Delete
                ? "The shop is closed now and everyone is signed out. Data is kept for the retention period (DataRetentionDaysAfterClose), then purged by a DBA."
                : dialog?.status === DataRequestStatus.Completed ? "Upload the export somewhere private and paste a time-limited link."
                : dialog?.status === DataRequestStatus.Rejected ? "The shop sees the reason." : "Marks the request as being worked on."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {dialog?.status === DataRequestStatus.Completed && dialog.item.kind === DataRequestKind.Export && (
              <div className="space-y-1.5"><Label>Download link</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
            )}
            <div className="space-y-1.5"><Label>{dialog?.status === DataRequestStatus.Rejected ? "Reason" : "Note (optional, shown to the shop)"}</Label>
              <Input maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant={dialog?.status === DataRequestStatus.Rejected || dialog?.item.kind === DataRequestKind.Delete ? "destructive" : "default"}
              disabled={m.process.isPending || (dialog?.status === DataRequestStatus.Rejected && !note.trim())
                || (dialog?.status === DataRequestStatus.Completed && dialog.item.kind === DataRequestKind.Export && !url.trim())}
              onClick={() => dialog && m.process.mutate(
                { id: dialog.item.id, body: { status: dialog.status, resultUrl: url.trim() || undefined, adminNote: note.trim() || undefined, rowVersion: dialog.item.rowVersion } },
                { onSuccess: () => { toast.success("Saved"); setDialog(null); }, onError: (e) => applyProblem(e) },
              )}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------- jobs

function JobsTab({ enabled }: { enabled: boolean }) {
  const can = useCan();
  const { data: jobs } = useJobs(enabled);
  const [jobName, setJobName] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const { data: runs } = useJobRuns({ page, pageSize: 20, jobName }, enabled);
  const run = useRunJob();
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const { data: details } = useJobRunDetails(detailsId);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {jobs?.map((j) => (
          <Card key={j.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <code>{j.name}</code>
                {j.lastRun && <Badge variant={j.lastRun.status === JobStatus.Failed ? "destructive" : j.lastRun.status === JobStatus.Running ? "secondary" : "default"}>
                  {jobStatusLabel[j.lastRun.status]}</Badge>}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{j.description} · {j.schedule}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {j.lastRun ? <>Last: {fmtDate(j.lastRun.startedAtUtc)}{j.lastRun.message ? ` · ${j.lastRun.message}` : ""}</> : "Never ran"}
              </span>
              {can(Perm.OpsManage) && (
                <Button size="sm" variant="outline" disabled={run.isPending} onClick={() => run.mutate(j.name, {
                  onSuccess: (r) => r.status === JobStatus.Failed ? toast.error(`Failed: ${r.message}`) : toast.success(r.message ?? "Done"),
                  onError: (e) => applyProblem(e),
                })}>Run now</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center justify-between">History
          <select className={select} value={jobName ?? ""} onChange={(e) => { setJobName(e.target.value || undefined); setPage(1); }}>
            <option value="">All jobs</option>
            {jobs?.map((j) => <option key={j.name} value={j.name}>{j.name}</option>)}
          </select></CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Started</TableHead><TableHead>Job</TableHead><TableHead>Trigger</TableHead><TableHead>Status</TableHead><TableHead>Items</TableHead><TableHead>Message</TableHead></TableRow></TableHeader>
            <TableBody>
              {runs?.items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{fmtDate(r.startedAtUtc)}</TableCell>
                  <TableCell><code className="text-xs">{r.jobName}</code></TableCell>
                  <TableCell>{r.triggerType}</TableCell>
                  <TableCell>
                    {r.status === JobStatus.Failed && can(Perm.OpsManage)
                      ? <button type="button" className="underline" onClick={() => setDetailsId(r.id)}><Badge variant="destructive">Failed</Badge></button>
                      : <Badge variant={r.status === JobStatus.Succeeded ? "default" : "secondary"}>{jobStatusLabel[r.status]}</Badge>}
                  </TableCell>
                  <TableCell>{r.itemsProcessed}</TableCell>
                  <TableCell className="max-w-md truncate text-xs" title={r.message ?? ""}>{r.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={page} pageSize={20} total={runs?.totalCount ?? 0} onPage={setPage} />
        </CardContent>
      </Card>

      <Dialog open={detailsId !== null} onOpenChange={(o) => { if (!o) setDetailsId(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>Failure details</DialogTitle></DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">{details ?? "No details."}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

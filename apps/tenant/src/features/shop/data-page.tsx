"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Input } from "@sellerhub/ui/components/input";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { useMe } from "@/features/auth/api";
import { DataRequestKind, dataStatusLabel, useDataRequestMutations, useDataRequests } from "./api";

/** Owner-only: download a copy of the shop's data, or ask for the account to be deleted. */
export function DataPage() {
  const { data: me } = useMe();
  const { data: requests } = useDataRequests();
  const m = useDataRequestMutations();
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const open = (kind: number) => requests?.some((r) => r.kind === kind && (r.status === 1 || r.status === 2));

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Export your data</CardTitle>
          <p className="text-sm text-muted-foreground">We prepare a copy of your shop&apos;s data and send you a download link here.</p>
        </CardHeader>
        <CardContent>
          <Button disabled={!me?.isOwner || open(DataRequestKind.Export) || m.create.isPending}
            onClick={() => m.create.mutate({ kind: DataRequestKind.Export }, { onSuccess: () => toast.success("Export requested"), onError: (e) => applyProblem(e) })}>
            Request export
          </Button>
          {!me?.isOwner && <p className="mt-2 text-xs text-muted-foreground">Only the shop owner can request this.</p>}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete the shop</CardTitle>
          <p className="text-sm text-muted-foreground">
            After we approve it the shop is closed and nobody can sign in. Data is kept for a short period and then permanently deleted.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Why are you leaving? (optional)" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          <Input placeholder='Type DELETE to confirm' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          <Button variant="destructive" disabled={!me?.isOwner || confirmText !== "DELETE" || open(DataRequestKind.Delete) || m.create.isPending}
            onClick={() => m.create.mutate({ kind: DataRequestKind.Delete, reason: reason.trim() || undefined },
              { onSuccess: () => { toast.success("Deletion requested"); setConfirmText(""); }, onError: (e) => applyProblem(e) })}>
            Request deletion
          </Button>
        </CardContent>
      </Card>

      {requests && requests.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Requests</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-md border p-3">
                  <b>{r.kind === DataRequestKind.Export ? "Export" : "Deletion"}</b>
                  <Badge variant="secondary">{dataStatusLabel[r.status]}</Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(r.requestedAtUtc)}</span>
                  {r.resultUrl && <a className="underline" href={r.resultUrl} target="_blank" rel="noreferrer">Download</a>}
                  {r.scheduledPurgeAtUtc && <span className="text-xs text-muted-foreground">Data deleted after {fmtDate(r.scheduledPurgeAtUtc)}</span>}
                  {r.adminNote && <span className="w-full text-xs text-muted-foreground">{r.adminNote}</span>}
                  {r.status === 1 && (
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => m.cancel.mutate(r.id, { onError: (e) => applyProblem(e) })}>Cancel</Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

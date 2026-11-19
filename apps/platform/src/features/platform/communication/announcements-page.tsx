"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sellerhub/ui/components/table";
import { applyProblem } from "@sellerhub/api-client/errors";
import dayjs, { fmtDate, getDisplayZone } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/access/api";
import { usePlans } from "@/features/platform/plans/api";
import { useTenants } from "@/features/platform/tenants/api";
import { Severity, Target, severityLabel, useAnnouncementMutations, useAnnouncements, type Announcement } from "./api";

const select = "h-9 w-full rounded-md border bg-background px-2 text-sm";
const toUtc = (local: string) => (local ? dayjs.tz(local, getDisplayZone()).utc().toISOString() : null);
const toLocal = (utc: string | null) => (utc ? dayjs.utc(utc).tz(getDisplayZone()).format("YYYY-MM-DDTHH:mm") : "");

type Form = {
  title: string; body: string; severity: number; targetType: number; targetPlanId: string; targetTenantId: string;
  starts: string; ends: string; isDismissible: boolean; isActive: boolean;
};
const empty: Form = { title: "", body: "", severity: Severity.Info, targetType: Target.All, targetPlanId: "", targetTenantId: "",
  starts: "", ends: "", isDismissible: true, isActive: true };

/** Banners shown in the shop app: to all shops, one plan, or one shop. */
export function AnnouncementsPage() {
  const can = useCan();
  const { data, isLoading } = useAnnouncements();
  const { data: plans } = usePlans();
  const [shopSearch, setShopSearch] = useState("");
  const { data: shops } = useTenants({ page: 1, pageSize: 20, search: shopSearch || undefined });
  const m = useAnnouncementMutations();
  const [editing, setEditing] = useState<{ a: Announcement | null } | null>(null);
  const [f, setF] = useState<Form>(empty);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const editable = can(Perm.AnnouncementManage);

  const open = (a: Announcement | null) => {
    setF(a ? {
      title: a.title, body: a.body, severity: a.severity, targetType: a.targetType, targetPlanId: a.targetPlanId?.toString() ?? "",
      targetTenantId: a.targetTenantId ?? "", starts: toLocal(a.startsAtUtc), ends: toLocal(a.endsAtUtc),
      isDismissible: a.isDismissible, isActive: a.isActive,
    } : empty);
    setShopSearch(a?.targetTenantName ?? "");
    setEditing({ a });
  };

  const targetOk = f.targetType === Target.All || (f.targetType === Target.Plan && f.targetPlanId) || (f.targetType === Target.Tenant && f.targetTenantId);

  return (
    <div className="space-y-4">
      {editable && <Button onClick={() => open(null)}>New announcement</Button>}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Spinner className="mx-auto size-6" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Title</TableHead><TableHead>Audience</TableHead><TableHead>When</TableHead>
                <TableHead>Status</TableHead><TableHead>Dismissed</TableHead><TableHead className="text-right" />
              </TableRow></TableHeader>
              <TableBody>
                {data?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.severity === Severity.Critical ? "destructive" : a.severity === Severity.Warning ? "secondary" : "outline"}>
                          {severityLabel[a.severity]}
                        </Badge>
                        <span className="font-medium">{a.title}</span>
                      </div>
                      <div className="max-w-md truncate text-xs text-muted-foreground">{a.body}</div>
                    </TableCell>
                    <TableCell>{a.targetType === Target.All ? "All shops" : a.targetType === Target.Plan ? `Plan: ${a.targetPlanName}` : `Shop: ${a.targetTenantName}`}</TableCell>
                    <TableCell className="text-xs">{fmtDate(a.startsAtUtc)} → {a.endsAtUtc ? fmtDate(a.endsAtUtc) : "no end"}</TableCell>
                    <TableCell><Badge variant={a.isLive ? "default" : "outline"}>{a.isLive ? "Live" : a.isActive ? "Scheduled / ended" : "Off"}</Badge></TableCell>
                    <TableCell>{a.isDismissible ? a.dismissCount : "Not dismissible"}</TableCell>
                    <TableCell className="text-right">
                      {editable && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => open(a)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => confirm("Delete this announcement?") &&
                            m.remove.mutate(a.id, { onSuccess: () => toast.success("Deleted"), onError: (e) => applyProblem(e) })}>Delete</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {data?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No announcements.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing?.a ? "Edit announcement" : "New announcement"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label>Title</Label>
              <Input maxLength={200} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Message</Label>
              <textarea className="min-h-24 w-full rounded-md border bg-background p-2 text-sm" maxLength={4000}
                value={f.body} onChange={(e) => set("body", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Severity</Label>
              <select className={select} value={f.severity} onChange={(e) => set("severity", Number(e.target.value))}>
                {Object.entries(severityLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label>Audience</Label>
              <select className={select} value={f.targetType} onChange={(e) => set("targetType", Number(e.target.value))}>
                <option value={Target.All}>All shops</option>
                <option value={Target.Plan}>Shops on a plan</option>
                <option value={Target.Tenant}>One shop</option>
              </select></div>
            {f.targetType === Target.Plan && (
              <div className="space-y-1.5 sm:col-span-2"><Label>Plan</Label>
                <select className={select} value={f.targetPlanId} onChange={(e) => set("targetPlanId", e.target.value)}>
                  <option value="">Choose…</option>
                  {plans?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
            )}
            {f.targetType === Target.Tenant && (
              <div className="space-y-1.5 sm:col-span-2"><Label>Shop</Label>
                <Input placeholder="Search shops…" value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} />
                <select className={select} value={f.targetTenantId} onChange={(e) => set("targetTenantId", e.target.value)}>
                  <option value="">Choose…</option>
                  {shops?.items.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>)}
                  {f.targetTenantId && !shops?.items.some((s) => s.id === f.targetTenantId) &&
                    <option value={f.targetTenantId}>{editing?.a?.targetTenantName ?? f.targetTenantId}</option>}
                </select></div>
            )}
            <div className="space-y-1.5"><Label>Starts ({getDisplayZone()})</Label>
              <Input type="datetime-local" value={f.starts} onChange={(e) => set("starts", e.target.value)} />
              <p className="text-xs text-muted-foreground">Empty = now</p></div>
            <div className="space-y-1.5"><Label>Ends (optional)</Label>
              <Input type="datetime-local" value={f.ends} onChange={(e) => set("ends", e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.isDismissible} onCheckedChange={(c) => set("isDismissible", c === true)} /> Shops can close it</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.isActive} onCheckedChange={(c) => set("isActive", c === true)} /> Active</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={!f.title.trim() || !f.body.trim() || !targetOk || m.save.isPending} onClick={() => m.save.mutate(
              { id: editing?.a?.id, body: {
                title: f.title.trim(), body: f.body.trim(), severity: f.severity, targetType: f.targetType,
                targetPlanId: f.targetType === Target.Plan ? Number(f.targetPlanId) : null,
                targetTenantId: f.targetType === Target.Tenant ? f.targetTenantId : null,
                startsAtUtc: toUtc(f.starts), endsAtUtc: toUtc(f.ends), isDismissible: f.isDismissible, isActive: f.isActive,
                rowVersion: editing?.a?.rowVersion ?? null } },
              { onSuccess: () => { toast.success("Saved"); setEditing(null); }, onError: (e) => applyProblem(e) },
            )}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

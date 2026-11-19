"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { Spinner } from "@sellerhub/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sellerhub/ui/components/table";
import { applyProblem } from "@sellerhub/api-client/errors";
import dayjs, { fmtDate, getDisplayZone } from "@sellerhub/ui/lib/dayjs";
import {
  LimitResetPeriod,
  useFeatureOverride,
  useLimitOverride,
  useTenantFeatures,
  useTenantLimits,
  type EntitlementSource,
  type TenantFeature,
  type TenantLimit,
} from "@/features/platform/entitlements/api";

const sourceVariant: Record<EntitlementSource, "default" | "secondary" | "outline"> = {
  Override: "default",
  Plan: "secondary",
  None: "outline",
};

const fmtLimit = (value: number | null, unit: string) =>
  value == null ? "Unlimited" : `${value.toLocaleString()}${unit === "count" ? "" : ` ${unit}`}`;

/** datetime-local value (in the display zone) to UTC ISO, and back. */
const toUtc = (local: string) => (local ? dayjs.tz(local, getDisplayZone()).utc().toISOString() : null);
const toLocalInput = (utc: string | null) =>
  utc ? dayjs.utc(utc).tz(getDisplayZone()).format("YYYY-MM-DDTHH:mm") : "";

function OverrideCell({ active, expiresAtUtc, reason, children }: {
  active: boolean; expiresAtUtc: string | null; reason: string | null; children: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        {children}
        {!active && <Badge variant="destructive">Expired</Badge>}
      </div>
      <div className="text-xs text-muted-foreground">
        {expiresAtUtc ? `Until ${fmtDate(expiresAtUtc)}` : "Permanent"}
      </div>
      {reason && <div className="max-w-56 truncate text-xs text-muted-foreground" title={reason}>{reason}</div>}
    </div>
  );
}

function ExpiryAndReason({ expires, setExpires, reason, setReason, reasonRequired }: {
  expires: string; setExpires: (v: string) => void; reason: string; setReason: (v: string) => void; reasonRequired: boolean;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="ent-expires">Expires (optional, {getDisplayZone()})</Label>
        <Input id="ent-expires" type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
        <p className="text-xs text-muted-foreground">Leave empty for a permanent override.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ent-reason">Reason{reasonRequired ? "" : " (optional)"}</Label>
        <Input
          id="ent-reason"
          maxLength={500}
          placeholder="e.g. Eid campaign, agreed on phone"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------- limits

type LimitDialog = { mode: "set" | "remove"; limit: TenantLimit } | null;

export function TenantLimitsCard({ tenantId, readOnly }: { tenantId: string; readOnly: boolean }) {
  const { data: limits, isLoading } = useTenantLimits(tenantId);
  const mutations = useLimitOverride(tenantId);
  const [dialog, setDialog] = useState<LimitDialog>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [value, setValue] = useState("");
  const [expires, setExpires] = useState("");
  const [reason, setReason] = useState("");

  const open = (mode: "set" | "remove", limit: TenantLimit) => {
    const current = limit.override ?? null;
    const start = current ? current.value : limit.effectiveValue;
    setUnlimited(start == null);
    setValue(start == null ? "" : String(start));
    setExpires(mode === "set" ? toLocalInput(current?.expiresAtUtc ?? null) : "");
    setReason(mode === "set" ? (current?.reason ?? "") : "");
    setDialog({ mode, limit });
  };

  const numeric = Number(value);
  const valueOk = unlimited || (value.trim() !== "" && Number.isInteger(numeric) && numeric >= 0);
  const pending = mutations.set.isPending || mutations.remove.isPending;

  const submit = () => {
    if (!dialog) return;
    const done = { onSuccess: () => { toast.success("Saved"); setDialog(null); }, onError: (e: unknown) => applyProblem(e) };
    if (dialog.mode === "remove") {
      mutations.remove.mutate({ key: dialog.limit.key, reason: reason.trim() || undefined }, done);
      return;
    }
    mutations.set.mutate(
      {
        key: dialog.limit.key,
        body: {
          value: unlimited ? null : numeric,
          expiresAtUtc: toUtc(expires),
          reason: reason.trim(),
          rowVersion: dialog.limit.override?.rowVersion ?? null,
        },
      },
      done,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limits</CardTitle>
        <p className="text-sm text-muted-foreground">
          A custom limit replaces the plan&apos;s value for this shop only. It can be higher or lower than the plan.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Spinner className="mx-auto size-6" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Limit</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Custom</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Used</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {limits?.map((l) => (
                <TableRow key={l.key}>
                  <TableCell>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.key}
                      {l.resetPeriod === LimitResetPeriod.Monthly && " · resets monthly"}
                    </div>
                  </TableCell>
                  <TableCell>{l.hasPlanValue ? fmtLimit(l.planValue, l.unit) : <span className="text-muted-foreground">Not set</span>}</TableCell>
                  <TableCell>
                    {l.override ? (
                      <OverrideCell active={l.overrideActive} expiresAtUtc={l.override.expiresAtUtc} reason={l.override.reason}>
                        {fmtLimit(l.override.value, l.unit)}
                      </OverrideCell>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{fmtLimit(l.effectiveValue, l.unit)}</span>
                      <Badge variant={sourceVariant[l.source]}>{l.source}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{l.used.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.remaining == null ? "No cap" : `${l.remaining.toLocaleString()} left`}
                    </div>
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => open("set", l)}>
                          {l.override ? "Edit" : "Customize"}
                        </Button>
                        {l.override && (
                          <Button size="sm" variant="ghost" onClick={() => open("remove", l)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={Boolean(dialog)} onOpenChange={(o) => { if (!o) setDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "remove" ? "Remove custom limit" : "Custom limit"}: {dialog?.limit.name}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === "remove"
                ? `The shop goes back to the plan value (${dialog ? (dialog.limit.hasPlanValue ? fmtLimit(dialog.limit.planValue, dialog.limit.unit) : "unlimited") : ""}).`
                : `Plan value: ${dialog ? (dialog.limit.hasPlanValue ? fmtLimit(dialog.limit.planValue, dialog.limit.unit) : "not set (unlimited)") : ""}. Used now: ${dialog?.limit.used.toLocaleString() ?? 0}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dialog?.mode === "set" && (
              <div className="space-y-1.5">
                <Label htmlFor="ent-value">Value{dialog.limit.unit !== "count" ? ` (${dialog.limit.unit})` : ""}</Label>
                <Input
                  id="ent-value"
                  type="number"
                  min={0}
                  step={1}
                  disabled={unlimited}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={unlimited} onCheckedChange={(c) => setUnlimited(c === true)} />
                  Unlimited
                </label>
                {!unlimited && valueOk && numeric < dialog.limit.used && (
                  <p className="text-xs text-amber-600">
                    Lower than current usage: nothing is deleted, but new items are blocked until usage drops.
                  </p>
                )}
              </div>
            )}
            {dialog?.mode === "set" ? (
              <ExpiryAndReason expires={expires} setExpires={setExpires} reason={reason} setReason={setReason} reasonRequired />
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="ent-reason">Reason (optional)</Label>
                <Input id="ent-reason" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              variant={dialog?.mode === "remove" ? "destructive" : "default"}
              disabled={pending || (dialog?.mode === "set" && (!valueOk || !reason.trim()))}
              onClick={submit}
            >
              {dialog?.mode === "remove" ? "Remove" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------- features

type FeatureDialog = { mode: "set" | "remove"; feature: TenantFeature } | null;

export function TenantFeaturesCard({ tenantId, readOnly }: { tenantId: string; readOnly: boolean }) {
  const { data: features, isLoading } = useTenantFeatures(tenantId);
  const mutations = useFeatureOverride(tenantId);
  const [dialog, setDialog] = useState<FeatureDialog>(null);
  const [enabled, setEnabled] = useState(true);
  const [expires, setExpires] = useState("");
  const [reason, setReason] = useState("");

  const open = (mode: "set" | "remove", feature: TenantFeature) => {
    const current = feature.override;
    // Default to the opposite of what the shop has now: that is why an override is being made.
    setEnabled(current ? current.isEnabled : !feature.isEnabled);
    setExpires(mode === "set" ? toLocalInput(current?.expiresAtUtc ?? null) : "");
    setReason(mode === "set" ? (current?.reason ?? "") : "");
    setDialog({ mode, feature });
  };

  const pending = mutations.set.isPending || mutations.remove.isPending;

  const submit = () => {
    if (!dialog) return;
    const done = { onSuccess: () => { toast.success("Saved"); setDialog(null); }, onError: (e: unknown) => applyProblem(e) };
    if (dialog.mode === "remove") {
      mutations.remove.mutate({ code: dialog.feature.code, reason: reason.trim() || undefined }, done);
      return;
    }
    mutations.set.mutate(
      {
        code: dialog.feature.code,
        body: {
          isEnabled: enabled,
          expiresAtUtc: toUtc(expires),
          reason: reason.trim(),
          rowVersion: dialog.feature.override?.rowVersion ?? null,
        },
      },
      done,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <p className="text-sm text-muted-foreground">
          Turn a feature on for this shop even if its plan does not include it, or turn it off even if it does.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Spinner className="mx-auto size-6" />
        ) : features && features.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active features in the catalog.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>In plan</TableHead>
                <TableHead>Custom</TableHead>
                <TableHead>Effective</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {features?.map((f) => (
                <TableRow key={f.code}>
                  <TableCell>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.code}</div>
                  </TableCell>
                  <TableCell>{f.inPlan ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {f.override ? (
                      <OverrideCell active={f.overrideActive} expiresAtUtc={f.override.expiresAtUtc} reason={f.override.reason}>
                        {f.override.isEnabled ? "Forced on" : "Forced off"}
                      </OverrideCell>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={f.isEnabled ? "default" : "outline"}>{f.isEnabled ? "On" : "Off"}</Badge>
                      <span className="text-xs text-muted-foreground">{f.source}</span>
                    </div>
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => open("set", f)}>
                          {f.override ? "Edit" : "Customize"}
                        </Button>
                        {f.override && (
                          <Button size="sm" variant="ghost" onClick={() => open("remove", f)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={Boolean(dialog)} onOpenChange={(o) => { if (!o) setDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "remove" ? "Remove custom setting" : "Custom feature setting"}: {dialog?.feature.name}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === "remove"
                ? `The shop goes back to the plan (${dialog?.feature.inPlan ? "on" : "off"}).`
                : `The plan ${dialog?.feature.inPlan ? "includes" : "does not include"} this feature.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dialog?.mode === "set" && (
              <div className="flex gap-2">
                <Button type="button" variant={enabled ? "default" : "outline"} onClick={() => setEnabled(true)}>
                  Force on
                </Button>
                <Button type="button" variant={!enabled ? "default" : "outline"} onClick={() => setEnabled(false)}>
                  Force off
                </Button>
              </div>
            )}
            {dialog?.mode === "set" ? (
              <ExpiryAndReason expires={expires} setExpires={setExpires} reason={reason} setReason={setReason} reasonRequired />
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="ent-reason">Reason (optional)</Label>
                <Input id="ent-reason" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              variant={dialog?.mode === "remove" ? "destructive" : "default"}
              disabled={pending || (dialog?.mode === "set" && !reason.trim())}
              onClick={submit}
            >
              {dialog?.mode === "remove" ? "Remove" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

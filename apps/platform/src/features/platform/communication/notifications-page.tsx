"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
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
import { money } from "@/features/platform/billing/api";
import {
  Channel, MessageStatus, channelLabel, messageStatusLabel, useMessageMutations, useMessageUsage, useMessages,
  useTemplateMutations, useTemplates, type Template,
} from "./api";

const select = "h-9 rounded-md border bg-background px-2 text-sm";

export function NotificationsPage() {
  const [tab, setTab] = useState("messages");
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="space-y-4">
      <TabsList variant="line">
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="usage">SMS usage</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>
      <TabsContent value="messages"><MessagesTab /></TabsContent>
      <TabsContent value="usage"><UsageTab enabled={tab === "usage"} /></TabsContent>
      <TabsContent value="templates"><TemplatesTab /></TabsContent>
    </Tabs>
  );
}

function MessagesTab() {
  const can = useCan();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<number | undefined>();
  const [channel, setChannel] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useMessages({ page, pageSize: 20, status, channel, search: search || undefined });
  const m = useMessageMutations();
  const [test, setTest] = useState<{ channel: number; recipient: string; subject: string; body: string } | null>(null);
  const editable = can(Perm.NotificationManage);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap gap-2">
          <select className={select} value={status ?? ""} onChange={(e) => { setStatus(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}>
            <option value="">All statuses</option>
            {Object.entries(messageStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className={select} value={channel ?? ""} onChange={(e) => { setChannel(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}>
            <option value="">Email + SMS</option>
            <option value={Channel.Email}>Email</option>
            <option value={Channel.Sms}>SMS</option>
          </select>
          <Input className="max-w-xs" placeholder="Search recipient or template…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          {editable && <Button variant="outline" className="ml-auto" onClick={() => setTest({ channel: Channel.Sms, recipient: "", subject: "", body: "SellerHub test message" })}>Send test</Button>}
        </div>
        {isLoading ? <Spinner className="mx-auto size-6" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Created</TableHead><TableHead>To</TableHead><TableHead>Shop</TableHead><TableHead>Message</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right" />
            </TableRow></TableHeader>
            <TableBody>
              {data?.items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="text-xs">{fmtDate(x.createdAtUtc)}</TableCell>
                  <TableCell><Badge variant="outline">{channelLabel[x.channel]}</Badge> {x.recipient}</TableCell>
                  <TableCell>{x.tenantId ? <Link className="underline" href={`/platform/tenants/${x.tenantId}`}>{x.tenantName ?? "Shop"}</Link> : "-"}</TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">{x.templateCode}</div>
                    <div className="max-w-md truncate text-sm" title={x.body}>{x.subject ? `${x.subject}: ` : ""}{x.body}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={x.status === MessageStatus.Sent ? "default" : x.status === MessageStatus.Failed ? "destructive" : "secondary"}>
                      {messageStatusLabel[x.status]}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {x.attemptCount} attempt(s){x.status === MessageStatus.Queued && x.attemptCount > 0 ? `, next ${fmtDate(x.nextAttemptAtUtc)}` : ""}
                    </div>
                    {x.error && <div className="max-w-56 truncate text-xs text-destructive" title={x.error}>{x.error}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable && (x.status === MessageStatus.Failed || x.status === MessageStatus.Cancelled) && (
                      <Button size="sm" variant="outline" onClick={() => m.retry.mutate(x.id, { onSuccess: () => toast.success("Queued again"), onError: (e) => applyProblem(e) })}>Retry</Button>
                    )}
                    {editable && x.status === MessageStatus.Queued && (
                      <Button size="sm" variant="ghost" onClick={() => m.cancel.mutate(x.id, { onError: (e) => applyProblem(e) })}>Cancel</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No messages.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
        <Pager page={page} pageSize={20} total={data?.totalCount ?? 0} onPage={setPage} />
      </CardContent>

      <Dialog open={Boolean(test)} onOpenChange={(o) => { if (!o) setTest(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a test message</DialogTitle>
            <DialogDescription>Queued like any other message; the dispatcher sends it within a minute.</DialogDescription>
          </DialogHeader>
          {test && (
            <div className="space-y-3">
              <select className={`${select} w-full`} value={test.channel} onChange={(e) => setTest({ ...test, channel: Number(e.target.value) })}>
                <option value={Channel.Sms}>SMS</option><option value={Channel.Email}>Email</option>
              </select>
              <Input placeholder={test.channel === Channel.Sms ? "+8801XXXXXXXXX" : "name@example.com"} value={test.recipient}
                onChange={(e) => setTest({ ...test, recipient: e.target.value })} />
              {test.channel === Channel.Email && <Input placeholder="Subject" value={test.subject} onChange={(e) => setTest({ ...test, subject: e.target.value })} />}
              <textarea className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" value={test.body}
                onChange={(e) => setTest({ ...test, body: e.target.value })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTest(null)}>Cancel</Button>
            <Button disabled={!test?.recipient.trim() || !test.body.trim() || m.test.isPending} onClick={() => test && m.test.mutate(
              { channel: test.channel, recipient: test.recipient.trim(), subject: test.subject.trim() || null, body: test.body.trim() },
              { onSuccess: () => { toast.success("Queued"); setTest(null); }, onError: (e) => applyProblem(e) },
            )}>Queue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function UsageTab({ enabled }: { enabled: boolean }) {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useMessageUsage(days, enabled);
  const total = (data ?? []).reduce((s, r) => s + r.cost, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          SMS and email per shop
          <select className={select} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Cost uses the provider&apos;s price, or the SmsCostPerMessage setting. Total {money(total)}.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? <Spinner className="mx-auto size-6" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Shop</TableHead><TableHead>SMS sent</TableHead><TableHead>Email sent</TableHead><TableHead>Failed</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.map((r) => (
                <TableRow key={r.tenantId ?? "platform"}>
                  <TableCell>{r.tenantId ? <Link className="underline" href={`/platform/tenants/${r.tenantId}`}>{r.tenantName ?? r.tenantId}</Link> : "Platform (tests)"}</TableCell>
                  <TableCell>{r.smsSent}</TableCell><TableCell>{r.emailSent}</TableCell><TableCell>{r.failed}</TableCell>
                  <TableCell>{money(r.cost)}</TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nothing sent in this period.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TemplatesTab() {
  const can = useCan();
  const { data, isLoading } = useTemplates();
  const m = useTemplateMutations();
  const [editing, setEditing] = useState<Template | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);
  const [adding, setAdding] = useState<{ code: string; channel: number; language: string; subject: string; body: string } | null>(null);
  const editable = can(Perm.NotificationManage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">Templates
          {editable && <Button size="sm" variant="outline" onClick={() => setAdding({ code: "", channel: Channel.Sms, language: "bn", subject: "", body: "" })}>Add language / channel</Button>}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {"Use {{Placeholder}} tokens; each template lists the ones it gets. A shop gets its own language, else English."}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? <Spinner className="mx-auto size-6" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Channel</TableHead><TableHead>Lang</TableHead><TableHead>Text</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {data?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><code className="text-xs">{t.code}</code>{t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}</TableCell>
                  <TableCell>{channelLabel[t.channel]}</TableCell>
                  <TableCell>{t.language}</TableCell>
                  <TableCell><div className="max-w-md truncate text-sm" title={t.body}>{t.subject ? <b>{t.subject} · </b> : null}{t.body}</div></TableCell>
                  <TableCell><Badge variant={t.isActive ? "default" : "outline"}>{t.isActive ? "On" : "Off"}</Badge></TableCell>
                  <TableCell className="text-right">
                    {editable && <Button size="sm" variant="outline" onClick={() => { setEditing(t); setSubject(t.subject ?? ""); setBody(t.body); setActive(t.isActive); }}>Edit</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.code} · {editing && channelLabel[editing.channel]} · {editing?.language}</DialogTitle>
            {editing?.description && <DialogDescription>Placeholders: {editing.description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-3">
            {editing?.channel === Channel.Email && <Input placeholder="Subject" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />}
            <textarea className="min-h-32 w-full rounded-md border bg-background p-2 text-sm" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
            {editing?.channel === Channel.Sms && <p className="text-xs text-muted-foreground">{body.length} characters (one SMS ≈ 160 Latin / 70 Bangla).</p>}
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={active} onCheckedChange={(c) => setActive(c === true)} /> Active</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={!body.trim() || m.update.isPending} onClick={() => editing && m.update.mutate(
              { id: editing.id, body: { subject: subject.trim() || null, body: body.trim(), isActive: active, rowVersion: editing.rowVersion } },
              { onSuccess: () => { toast.success("Template saved"); setEditing(null); }, onError: (e) => applyProblem(e) },
            )}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(adding)} onOpenChange={(o) => { if (!o) setAdding(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>New template version</DialogTitle></DialogHeader>
          {adding && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3"><Label>Code</Label>
                <Input placeholder="plan.expiry_reminder" value={adding.code} onChange={(e) => setAdding({ ...adding, code: e.target.value.trim() })} /></div>
              <select className={select} value={adding.channel} onChange={(e) => setAdding({ ...adding, channel: Number(e.target.value) })}>
                <option value={Channel.Sms}>SMS</option><option value={Channel.Email}>Email</option>
              </select>
              <Input placeholder="Language (bn, en)" value={adding.language} onChange={(e) => setAdding({ ...adding, language: e.target.value })} />
              <div />
              {adding.channel === Channel.Email && <Input className="sm:col-span-3" placeholder="Subject" value={adding.subject} onChange={(e) => setAdding({ ...adding, subject: e.target.value })} />}
              <textarea className="min-h-28 w-full rounded-md border bg-background p-2 text-sm sm:col-span-3" value={adding.body}
                onChange={(e) => setAdding({ ...adding, body: e.target.value })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(null)}>Cancel</Button>
            <Button disabled={!adding?.code || !adding.body.trim() || m.create.isPending} onClick={() => adding && m.create.mutate(
              { code: adding.code, channel: adding.channel, language: adding.language.trim() || "en",
                subject: adding.channel === Channel.Email ? adding.subject.trim() || null : null, body: adding.body.trim(),
                description: data?.find((t) => t.code === adding.code)?.description ?? null },
              { onSuccess: () => { toast.success("Template added"); setAdding(null); }, onError: (e) => applyProblem(e) },
            )}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCheck,
  Flag,
  Paperclip,
  Send,
  Smile,
  Store,
  User,
} from "lucide-react";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Input } from "@sellerhub/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sellerhub/ui/components/select";
import { ScrollArea } from "@sellerhub/ui/components/scroll-area";
import { Separator } from "@sellerhub/ui/components/separator";
import { Avatar, AvatarFallback } from "@sellerhub/ui/components/avatar";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/roles/api";
import { useAdmins } from "@/features/platform/admins/api";
import { useAuthStore } from "@/features/platform/auth/store";
import { Pager } from "@/components/pager";
import {
  AuthorType,
  TicketPriority,
  TicketStatus,
  priorityLabel,
  ticketStatusLabel,
  useTicket,
  useTicketMutations,
  useTickets,
} from "./api";

const initials = (n: string) =>
  n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "?";
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
const dayKey = (d: string) => new Date(d).toDateString();
const dayLabel = (d: string) => {
  const date = new Date(d);
  const txt = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return date.toDateString() === new Date().toDateString()
    ? `Today, ${txt}`
    : txt;
};

const statusChips: { key: number | undefined; label: string }[] = [
  { key: undefined, label: "All" },
  ...Object.entries(ticketStatusLabel).map(([v, l]) => ({
    key: Number(v),
    label: String(l),
  })),
];

/** Support inbox: list on the left, conversation on the right. */
export function SupportPage() {
  const meId = useAuthStore((s) => s.admin?.id);
  const [status, setStatus] = useState<number | undefined>(TicketStatus.Open);
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useTickets({
    page,
    pageSize: 20,
    status,
    search: search || undefined,
    assignedAdminId: mine ? meId : undefined,
  });

  return (
    <div className="grid h-[calc(100vh-8rem)] min-h-130 gap-4 lg:grid-cols-[380px_1fr]">
      <section
        className={`flex min-h-0 flex-col rounded-2xl border bg-card ${openId ? "hidden lg:flex" : ""}`}
      >
        <div className="space-y-3 p-4 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Support inbox</h2>
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              {data?.totalCount ?? 0}
            </Badge>
          </div>
          <Input
            placeholder="Search number, subject, shop…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <div className="flex flex-wrap gap-2">
            {statusChips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setStatus(c.key);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${status === c.key ? "border-primary/40 bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={mine}
              onCheckedChange={(c) => {
                setMine(c === true);
                setPage(1);
              }}
            />{" "}
            Assigned to me
          </label>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 px-3 pb-3">
            {isLoading && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            )}
            {data?.items.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setOpenId(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${openId === t.id ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-muted/60"}`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Store className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {t.tenantName}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {fmtDate(t.lastMessageAtUtc)}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.number} · {t.subject}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge
                      variant={
                        t.priority >= TicketPriority.High
                          ? "destructive"
                          : "outline"
                      }
                      className="h-5 px-1.5 text-[11px]"
                    >
                      {priorityLabel[t.priority]}
                    </Badge>
                    <Badge
                      variant={
                        t.status === TicketStatus.Open ? "default" : "secondary"
                      }
                      className="h-5 px-1.5 text-[11px]"
                    >
                      {ticketStatusLabel[t.status]}
                    </Badge>
                    <span className="ml-auto truncate text-[11px] text-muted-foreground">
                      {t.assignedAdminName ?? "Unassigned"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {data?.items.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No tickets.
              </p>
            )}
          </div>
        </ScrollArea>
        <div className="border-t px-4 py-2">
          <Pager
            page={page}
            pageSize={20}
            total={data?.totalCount ?? 0}
            onPage={setPage}
          />
        </div>
      </section>

      <section
        className={`min-h-0 flex-col rounded-2xl border bg-card ${openId ? "flex" : "hidden lg:flex"}`}
      >
        {openId ? (
          <TicketView key={openId} id={openId} onBack={() => setOpenId(null)} />
        ) : (
          <div className="m-auto text-sm text-muted-foreground">
            Select a ticket to view the conversation.
          </div>
        )}
      </section>
    </div>
  );
}

function PillSelect({
  label,
  icon,
  value,
  items,
  onChange,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  /** value → label, so the trigger shows the label before the list was ever opened. */
  items: Record<string, React.ReactNode>;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <Select
        items={items}
        value={value}
        onValueChange={(v) => v != null && onChange(v)}
      >
        <SelectTrigger className="w-full rounded-xl border-primary/20 font-medium shadow-sm data-[size=default]:h-10">
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-primary">{icon}</span>
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function TicketView({ id, onBack }: { id: string; onBack: () => void }) {
  const can = useCan();
  const { data: t } = useTicket(id);
  const { data: admins } = useAdmins();
  const m = useTicketMutations();
  const [message, setMessage] = useState("");
  const [internal, setInternal] = useState(false);
  const [nextStatus, setNextStatus] = useState<number>(
    TicketStatus.WaitingOnShop,
  );
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [t?.messages.length]);
  const editable = can(Perm.SupportManage);

  const update = (
    patch: Partial<{
      status: number;
      priority: number;
      assignedAdminId: string | null;
    }>,
  ) =>
    t &&
    m.update.mutate(
      {
        id: t.id,
        body: {
          status: t.status,
          priority: t.priority,
          assignedAdminId: t.assignedAdminId,
          rowVersion: t.rowVersion,
          ...patch,
        },
      },
      { onError: (er) => applyProblem(er) },
    );

  const send = () => {
    if (!t || !message.trim() || m.reply.isPending) return;
    m.reply.mutate(
      {
        id: t.id,
        body: {
          message: message.trim(),
          isInternal: internal,
          status: internal ? undefined : nextStatus,
        },
      },
      {
        onSuccess: () => {
          setMessage("");
          toast.success(internal ? "Note added" : "Reply sent");
        },
        onError: (e) => applyProblem(e),
      },
    );
  };

  const groups = useMemo(() => {
    const out: {
      key: string;
      label: string;
      items: NonNullable<typeof t>["messages"];
    }[] = [];
    t?.messages.forEach((msg) => {
      const k = dayKey(msg.createdAtUtc);
      const last = out[out.length - 1];
      if (last?.key === k) last.items.push(msg);
      else
        out.push({ key: k, label: dayLabel(msg.createdAtUtc), items: [msg] });
    });
    return out;
  }, [t]);

  if (!t)
    return <div className="m-auto text-sm text-muted-foreground">Loading…</div>;

  return (
    <>
      <div className="flex items-center gap-3 border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full lg:hidden"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Store className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold">
            {t.number} · {t.subject}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            <Link
              className="underline"
              href={`/platform/tenants/${t.tenantId}`}
            >
              {t.tenantName}
            </Link>{" "}
            · Opened {fmtDate(t.createdAtUtc)}
          </div>
        </div>
      </div>

      {editable && (
        <div className="flex gap-3 border-b px-4 py-3">
          <PillSelect
            label="Status"
            icon={<span className="block size-2 rounded-full bg-primary" />}
            value={String(t.status)}
            items={ticketStatusLabel}
            onChange={(v) => update({ status: Number(v) })}
          >
            {Object.entries(ticketStatusLabel).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </PillSelect>
          <PillSelect
            label="Priority"
            icon={<Flag className="size-4" />}
            value={String(t.priority)}
            items={priorityLabel}
            onChange={(v) => update({ priority: Number(v) })}
          >
            {Object.entries(priorityLabel).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </PillSelect>
          <PillSelect
            label="Assigned to"
            icon={<User className="size-4" />}
            value={t.assignedAdminId ?? "none"}
            items={{
              none: "Unassigned",
              ...Object.fromEntries(
                (admins ?? []).map((a) => [a.id, a.fullName]),
              ),
            }}
            onChange={(v) =>
              update({ assignedAdminId: v === "none" ? null : v })
            }
          >
            <SelectItem value="none">Unassigned</SelectItem>
            {admins?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.fullName}
              </SelectItem>
            ))}
          </PillSelect>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 px-5 py-4">
          {groups.map((g) => (
            <div key={g.key} className="space-y-3">
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-medium text-muted-foreground"
                >
                  {g.label}
                </Badge>
                <Separator className="flex-1" />
              </div>
              {g.items.map((msg) => {
                const mine = msg.authorType === AuthorType.PlatformAdmin;
                const name = msg.authorName ?? (mine ? "Support" : "Shop");
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="size-8">
                      <AvatarFallback
                        className={`text-xs font-semibold text-primary ${mine ? "bg-primary/20" : "bg-primary/10"}`}
                      >
                        {initials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        msg.isInternal
                          ? "rounded-br-sm border border-amber-400/60 bg-amber-50 text-foreground dark:bg-amber-950/30"
                          : mine
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm border bg-background"
                      }`}
                    >
                      {!mine && (
                        <div className="mb-0.5 text-xs font-medium text-primary">
                          {name}
                        </div>
                      )}
                      {msg.isInternal && (
                        <div className="mb-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          Internal note
                        </div>
                      )}
                      <p className="whitespace-pre-wrap wrap-break-word">
                        {msg.body}
                      </p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine && !msg.isInternal ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {fmtTime(msg.createdAtUtc)}
                        {mine && !msg.isInternal && (
                          <CheckCheck className="size-3.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {editable && t.status !== TicketStatus.Closed ? (
        <div className="space-y-3 border-t p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={internal}
                onCheckedChange={(c) => setInternal(c === true)}
              />{" "}
              Internal note
            </label>
            {!internal && (
              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                Then:
                <Select
                  items={{
                    [TicketStatus.WaitingOnShop]: "Waiting on shop",
                    [TicketStatus.Resolved]: "Resolved",
                    [TicketStatus.Open]: "Keep open",
                  }}
                  value={String(nextStatus)}
                  onValueChange={(v) => v != null && setNextStatus(Number(v))}
                >
                  <SelectTrigger className="rounded-xl font-medium text-foreground shadow-sm data-[size=default]:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(TicketStatus.WaitingOnShop)}>
                      Waiting on shop
                    </SelectItem>
                    <SelectItem value={String(TicketStatus.Resolved)}>
                      Resolved
                    </SelectItem>
                    <SelectItem value={String(TicketStatus.Open)}>
                      Keep open
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-2xl border bg-background px-2 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Attach"
            >
              <Paperclip className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Emoji"
            >
              <Smile className="size-5" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Input
              className="flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
              maxLength={4000}
              placeholder={
                internal
                  ? "Internal note (the shop never sees it)"
                  : "Reply to the shop…"
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button
              size="icon"
              className="size-10 rounded-xl"
              disabled={!message.trim() || m.reply.isPending}
              onClick={send}
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="border-t p-4 text-sm text-muted-foreground">
          {t.status === TicketStatus.Closed
            ? "This ticket is closed."
            : "You have view-only access."}
        </p>
      )}
    </>
  );
}

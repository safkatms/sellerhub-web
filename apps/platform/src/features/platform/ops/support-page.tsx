"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCheck,
  Flag,
  MessageSquareText,
  Paperclip,
  Send,
  Smile,
  User,
} from "lucide-react";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Input } from "@sellerhub/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@sellerhub/ui/components/sheet";
import { Spinner } from "@sellerhub/ui/components/spinner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sellerhub/ui/components/table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/access/api";
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

const select = "h-9 rounded-md border bg-background px-2 text-sm";

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

/** Support inbox: open tickets first, then by priority and last message. */
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={select}
          value={status ?? ""}
          onChange={(e) => {
            setStatus(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
        >
          <option value="">All</option>
          {Object.entries(ticketStatusLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <Input
          className="max-w-xs"
          placeholder="Search number, subject, shop…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Spinner className="mx-auto size-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Last message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => setOpenId(t.id)}
                  >
                    <TableCell>
                      <div className="font-medium">{t.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.number}
                        {t.category ? ` · ${t.category}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>{t.tenantName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.priority >= TicketPriority.High
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {priorityLabel[t.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === TicketStatus.Open
                            ? "default"
                            : "secondary"
                        }
                      >
                        {ticketStatusLabel[t.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.assignedAdminName ?? (
                        <span className="text-muted-foreground">Nobody</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {fmtDate(t.lastMessageAtUtc)}
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No tickets.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <Pager
            page={page}
            pageSize={20}
            total={data?.totalCount ?? 0}
            onPage={setPage}
          />
        </CardContent>
      </Card>
      <TicketSheet id={openId} onClose={() => setOpenId(null)} />
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

function TicketSheet({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
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
    setMessage("");
    setInternal(false);
  }, [id]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [t?.messages.length, id]);
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

  return (
    <Sheet
      open={Boolean(id)}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="flex-row items-center gap-4 space-y-0 border-b p-5 pr-12 text-left">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquareText className="size-6" />
          </div>
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg font-semibold">
              {t ? `${t.number} · ${t.subject}` : "Loading…"}
            </SheetTitle>
            {t && (
              <div className="truncate text-sm text-muted-foreground">
                Shop:{" "}
                <Link
                  className="underline"
                  href={`/platform/tenants/${t.tenantId}`}
                >
                  {t.tenantName}
                </Link>{" "}
                · Opened {fmtDate(t.createdAtUtc)}
              </div>
            )}
          </div>
        </SheetHeader>

        {t && (
          <>
            {editable && (
              <div className="flex gap-3 border-b px-5 py-4">
                <PillSelect
                  label="Status"
                  icon={
                    <span className="block size-2 rounded-full bg-primary" />
                  }
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
                  <div key={g.key} className="space-y-4">
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
                      const name =
                        msg.authorName ?? (mine ? "Support" : "Shop");
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${mine ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="size-9">
                            <AvatarFallback
                              className={`text-xs font-semibold text-primary ${mine ? "bg-primary/20" : "bg-primary/10"}`}
                            >
                              {initials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                              msg.isInternal
                                ? "border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30"
                                : mine
                                  ? "bg-primary/10"
                                  : "bg-muted"
                            }`}
                          >
                            <div className="mb-0.5 text-xs text-muted-foreground">
                              {name} · {fmtTime(msg.createdAtUtc)}
                              {msg.isInternal && " · internal note"}
                            </div>
                            <div className="flex items-end gap-2">
                              <p className="whitespace-pre-wrap wrap-break-word">
                                {msg.body}
                              </p>
                              {mine && !msg.isInternal && (
                                <CheckCheck className="size-4 shrink-0 text-primary" />
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
            <div className="flex flex-wrap items-center gap-3 border-t px-5 pt-4">
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
                    <SelectTrigger className="rounded-xl font-medium text-foreground shadow-sm data-[size=default]:h-10">
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
            {editable && t.status !== TicketStatus.Closed && (
              <div className="space-y-3 px-5 py-4">
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
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCheck,
  Headphones,
  Paperclip,
  Plus,
  Send,
  Smile,
  Store,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@sellerhub/ui/components/avatar";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { ScrollArea } from "@sellerhub/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sellerhub/ui/components/select";
import { Separator } from "@sellerhub/ui/components/separator";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import {
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
  const txt = new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return dayKey(d) === new Date().toDateString() ? `Today, ${txt}` : txt;
};

const statusUi = (s: number) =>
  s === TicketStatus.WaitingOnShop
    ? { label: "Waiting for you", cls: "bg-primary/10 text-primary" }
    : s === TicketStatus.Open
      ? {
          label: "Open",
          cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        }
      : { label: ticketStatusLabel[s], cls: "bg-muted text-muted-foreground" };

const filters = [
  { key: "all", label: "All", match: () => true },
  { key: "open", label: "Open", match: (s: number) => s === TicketStatus.Open },
  {
    key: "waiting",
    label: "Waiting",
    match: (s: number) => s === TicketStatus.WaitingOnShop,
  },
  {
    key: "resolved",
    label: "Resolved",
    match: (s: number) => s === TicketStatus.Resolved,
  },
];

const topics = ["General", "Billing", "Bug", "Feature request", "Account"];

/** Ask SellerHub for help and follow the answers. */
export function SupportPage() {
  const { data: tickets } = useTickets();
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);

  const list = useMemo(() => {
    const f = filters.find((x) => x.key === filter)!;
    return tickets?.filter((t) => f.match(t.status)) ?? [];
  }, [tickets, filter]);

  return (
    <div className="grid h-[calc(100vh-8rem)] min-h-130 gap-4 lg:grid-cols-[360px_1fr]">
      <section
        className={`flex min-h-0 flex-col rounded-2xl border bg-card ${openId ? "hidden lg:flex" : ""}`}
      >
        <div className="flex items-center gap-2 p-5 pb-3">
          <h2 className="text-lg font-semibold">All requests</h2>
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
            {tickets?.length ?? 0}
          </Badge>
          <Button
            size="sm"
            className="ml-auto rounded-xl"
            onClick={() => setNewOpen(true)}
          >
            <Plus className="size-4" /> New
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3.5 py-1 text-sm font-medium transition-colors ${filter === f.key ? "border-primary/40 bg-primary/10 text-primary" : "hover:bg-muted"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 px-3 pb-4">
            {list.map((t) => {
              const ui = statusUi(t.status);
              return (
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
                    <div className="truncate text-sm font-semibold">
                      {t.subject}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.number} · {fmtDate(t.lastMessageAtUtc)}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ui.cls}`}
                  >
                    {ui.label}
                  </span>
                </button>
              );
            })}
            {list.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No requests.
              </p>
            )}
          </div>
        </ScrollArea>
      </section>

      <section
        className={`min-h-0 flex-col rounded-2xl border bg-card ${openId ? "flex" : "hidden lg:flex"}`}
      >
        {openId ? (
          <TicketView key={openId} id={openId} onBack={() => setOpenId(null)} />
        ) : (
          <div className="m-auto text-sm text-muted-foreground">
            Select a request to view the conversation.
          </div>
        )}
      </section>

      <NewRequestDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => setOpenId(id)}
      />
    </div>
  );
}

function TicketView({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: t } = useTicket(id);
  const m = useTicketMutations();
  const [message, setMessage] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [t?.messages.length]);

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

  const send = () => {
    if (!message.trim() || m.reply.isPending) return;
    m.reply.mutate(
      { id, message: message.trim() },
      { onSuccess: () => setMessage(""), onError: (e) => applyProblem(e) },
    );
  };

  if (!t)
    return <div className="m-auto text-sm text-muted-foreground">Loading…</div>;
  const ui = statusUi(t.status);

  return (
    <>
      <div className="flex items-center gap-3 border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold">{t.subject}</div>
          <div className="truncate text-xs text-muted-foreground">
            {t.number} · Opened {fmtDate(t.createdAtUtc)}
          </div>
        </div>
        <span
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${ui.cls}`}
        >
          <span className="size-2 rounded-full bg-current" />
          {ui.label}
        </span>
      </div>

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
                const support = msg.authorType === 2;
                const name = support
                  ? `SellerHub support${msg.authorName ? ` (${msg.authorName})` : ""}`
                  : (msg.authorName ?? "You");
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${support ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="size-9">
                      <AvatarFallback
                        className={`text-xs font-semibold text-primary ${support ? "bg-primary/20" : "bg-primary/10"}`}
                      >
                        {initials(
                          support ? (msg.authorName ?? "Support") : name,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${support ? "bg-primary/10" : "border bg-background"}`}
                    >
                      <div className="mb-0.5 text-xs text-muted-foreground">
                        {name} · {fmtTime(msg.createdAtUtc)}
                      </div>
                      <div className="flex items-end gap-2">
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {msg.body}
                        </p>
                        {support && (
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

      {t.status !== TicketStatus.Closed ? (
        <div className="flex flex-wrap items-center gap-3 border-t p-4">
          <div className="flex min-w-0 flex-1 basis-64 items-center gap-1 rounded-2xl border bg-background px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
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
            <Input
              className="h-9 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
              maxLength={4000}
              placeholder="Write a reply…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
          </div>
          <Button
            className="h-11 rounded-xl px-5"
            disabled={!message.trim() || m.reply.isPending}
            onClick={send}
          >
            <Send className="size-4" /> Reply
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() =>
              confirm("Close this request?") &&
              m.close.mutate(id, { onError: (e) => applyProblem(e) })
            }
          >
            Close request
          </Button>
        </div>
      ) : (
        <p className="border-t p-4 text-sm text-muted-foreground">
          This request is closed. Open a new one if you need more help.
        </p>
      )}
    </>
  );
}

function NewRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const m = useTicketMutations();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("2");
  const [message, setMessage] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="size-5 text-primary" /> New request
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Subject</Label>
            <Input
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Topic</Label>
            <Select value={category} onValueChange={(v) => v != null && setCategory(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {topics.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select items={priorityLabel} value={priority} onValueChange={(v) => v != null && setPriority(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabel).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Message</Label>
            <textarea
              className="min-h-28 w-full rounded-md border bg-background p-2 text-sm"
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              className="rounded-xl"
              disabled={!subject.trim() || !message.trim() || m.open.isPending}
              onClick={() =>
                m.open.mutate(
                  {
                    subject: subject.trim(),
                    category: category === "General" ? undefined : category,
                    priority: Number(priority),
                    message: message.trim(),
                  },
                  {
                    onSuccess: (t) => {
                      toast.success(`Ticket ${t.number} opened`);
                      setSubject("");
                      setMessage("");
                      onOpenChange(false);
                      onCreated(t.id);
                    },
                    onError: (e) => applyProblem(e),
                  },
                )
              }
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

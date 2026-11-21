"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Channel, useMessageMutations } from "./api";

const select = "h-9 rounded-md border bg-background px-2 text-sm";

export function TestMessageDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const m = useMessageMutations();
  const [t, setT] = useState({
    channel: Channel.Sms as number,
    recipient: "",
    subject: "",
    body: "SellerHub test message",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a test message</DialogTitle>
          <DialogDescription>
            Queued like any other message; the dispatcher sends it within a
            minute.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <select
            className={`${select} w-full`}
            value={t.channel}
            onChange={(e) => setT({ ...t, channel: Number(e.target.value) })}
          >
            <option value={Channel.Sms}>SMS</option>
            <option value={Channel.Email}>Email</option>
          </select>
          <Input
            placeholder={
              t.channel === Channel.Sms ? "+8801XXXXXXXXX" : "name@example.com"
            }
            value={t.recipient}
            onChange={(e) => setT({ ...t, recipient: e.target.value })}
          />
          {t.channel === Channel.Email && (
            <Input
              placeholder="Subject"
              value={t.subject}
              onChange={(e) => setT({ ...t, subject: e.target.value })}
            />
          )}
          <textarea
            className="min-h-20 w-full rounded-md border bg-background p-2 text-sm"
            value={t.body}
            onChange={(e) => setT({ ...t, body: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!t.recipient.trim() || !t.body.trim() || m.test.isPending}
            onClick={() =>
              m.test.mutate(
                {
                  channel: t.channel,
                  recipient: t.recipient.trim(),
                  subject: t.subject.trim() || null,
                  body: t.body.trim(),
                },
                {
                  onSuccess: () => {
                    toast.success("Queued");
                    onClose();
                  },
                  onError: (e) => applyProblem(e),
                },
              )
            }
          >
            Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

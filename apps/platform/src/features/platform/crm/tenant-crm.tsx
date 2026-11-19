"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@sellerhub/ui/components/dialog";
import { Input } from "@sellerhub/ui/components/input";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/access/api";
import { tagStyle, useNoteMutations, useSetTenantTags, useTagMutations, useTags, useTenantNotes, useTenantTags } from "./api";

/** Internal notes and tags for one shop. Never shown to the shop. */
export function TenantCrmCards({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-4">
      <TagsCard tenantId={tenantId} />
      <NotesCard tenantId={tenantId} />
    </div>
  );
}

function TagsCard({ tenantId }: { tenantId: string }) {
  const can = useCan();
  const { data: all } = useTags();
  const { data: mine } = useTenantTags(tenantId);
  const setTags = useSetTenantTags(tenantId);
  const tags = useTagMutations();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("");
  const editable = can(Perm.TenantCrm);

  useEffect(() => { if (mine) setSelected(new Set(mine.map((t) => t.id))); }, [mine, open]);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center justify-between">Tags
        {editable && <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Edit tags</Button>}</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {mine?.length === 0 && <span className="text-sm text-muted-foreground">No tags.</span>}
        {mine?.map((t) => <Badge key={t.id} variant="outline" style={tagStyle(t.color)}>{t.name}</Badge>)}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tags for this shop</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {all?.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selected.has(t.id)} onCheckedChange={(c) => {
                  const next = new Set(selected);
                  if (c === true) next.add(t.id); else next.delete(t.id);
                  setSelected(next);
                }} />
                <Badge variant="outline" style={tagStyle(t.color)}>{t.name}</Badge>
                <span className="text-xs text-muted-foreground">{t.tenantCount} shop(s)</span>
                <Button size="icon" variant="ghost" className="ml-auto size-7" aria-label={`Delete tag ${t.name}`}
                  onClick={() => confirm(`Delete tag "${t.name}" from all ${t.tenantCount} shop(s)?`) &&
                    tags.remove.mutate(t.id, { onError: (e) => applyProblem(e) })}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Input placeholder="New tag" maxLength={50} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input className="w-28" placeholder="red / #16a34a" maxLength={20} value={newColor} onChange={(e) => setNewColor(e.target.value)} />
              <Button variant="outline" disabled={!newName.trim() || tags.save.isPending} onClick={() => tags.save.mutate(
                { body: { name: newName.trim(), color: newColor.trim() || null } },
                { onSuccess: () => { setNewName(""); setNewColor(""); }, onError: (e) => applyProblem(e) },
              )}>Add</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={setTags.isPending} onClick={() => setTags.mutate([...selected], {
              onSuccess: () => { toast.success("Tags saved"); setOpen(false); }, onError: (e) => applyProblem(e),
            })}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function NotesCard({ tenantId }: { tenantId: string }) {
  const can = useCan();
  const { data: notes } = useTenantNotes(tenantId);
  const m = useNoteMutations(tenantId);
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const editable = can(Perm.TenantCrm);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal notes</CardTitle>
        <p className="text-sm text-muted-foreground">For admins only, e.g. &quot;called the owner, will pay next week&quot;.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {editable && (
          <div className="space-y-2">
            <textarea className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" maxLength={4000}
              placeholder="Write a note…" value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={pinned} onCheckedChange={(c) => setPinned(c === true)} /> Pin to top</label>
              <Button size="sm" disabled={!body.trim() || m.add.isPending} onClick={() => m.add.mutate(
                { body: body.trim(), isPinned: pinned },
                { onSuccess: () => { setBody(""); setPinned(false); }, onError: (e) => applyProblem(e) },
              )}>Add note</Button>
            </div>
          </div>
        )}
        {notes?.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        <ul className="space-y-3">
          {notes?.map((n) => (
            <li key={n.id} className={`rounded-md border p-3 ${n.isPinned ? "border-primary/40 bg-primary/5" : ""}`}>
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                {n.isPinned && <Pin className="size-3" />}
                <span>{n.createdByName ?? "Admin"} · {fmtDate(n.createdAtUtc)}{n.updatedAtUtc ? " (edited)" : ""}</span>
                {editable && (
                  <span className="ml-auto flex gap-1">
                    <Button size="icon" variant="ghost" className="size-7" aria-label={n.isPinned ? "Unpin" : "Pin"}
                      onClick={() => m.update.mutate({ id: n.id, body: { body: n.body, isPinned: !n.isPinned, rowVersion: n.rowVersion } },
                        { onError: (e) => applyProblem(e) })}>
                      {n.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" aria-label="Delete note"
                      onClick={() => confirm("Delete this note?") && m.remove.mutate(n.id, { onError: (e) => applyProblem(e) })}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.body}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

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
import { Label } from "@sellerhub/ui/components/label";
import { DataTable } from "@sellerhub/ui/data-table";
import { Filters, type FilterDef } from "@sellerhub/ui/filters";
import { useServerList } from "@sellerhub/ui/hooks/use-server-list";
import { CircleCheck, FileText } from "lucide-react";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Perm, useCan } from "@/features/platform/roles/api";
import {
  DataRequestKind,
  DataRequestStatus,
  dataKindLabel,
  dataStatusLabel,
  useDataRequestMutations,
  useDataRequests,
  type DataRequestItem,
} from "./api";
import { dataRequestColumns } from "./columns";

const defs: FilterDef[] = [
  {
    key: "status",
    type: "select",
    allLabel: "All statuses",
    defaultValue: String(DataRequestStatus.Pending),
    options: Object.entries(dataStatusLabel).map(([value, label]) => ({
      value,
      label,
    })),
    icon: CircleCheck,
  },
  {
    key: "kind",
    type: "select",
    allLabel: "All kinds",
    options: Object.entries(dataKindLabel).map(([value, label]) => ({
      value,
      label,
    })),
    icon: FileText,
  },
  { key: "range", field: "requestedAtUtc", type: "date-range" },
  { key: "search", type: "search", placeholder: "Search shop…" },
];

export function DataRequestsPage() {
  const can = useCan();
  const editable = can(Perm.OpsManage);
  const list = useServerList({ defs });
  const { data, isLoading } = useDataRequests(list.request);
  const m = useDataRequestMutations();
  const [dialog, setDialog] = useState<{
    item: DataRequestItem;
    status: number;
  } | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const columns = dataRequestColumns(editable, {
    onProcess: (item, s) => {
      setUrl(item.resultUrl ?? "");
      setNote("");
      setDialog({ item, status: s });
    },
    onPurge: (item) =>
      confirm(
        "Confirm the shop's data was purged by a DBA. This only records it.",
      ) &&
      m.markPurged.mutate(item.id, {
        onSuccess: () => toast.success("Recorded"),
        onError: (e) => applyProblem(e),
      }),
  });

  const isExportComplete =
    dialog?.status === DataRequestStatus.Completed &&
    dialog.item.kind === DataRequestKind.Export;

  return (
    <div className="space-y-4">
      <Filters filters={list.filters} />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        {...list.table}
      />

      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog &&
                `${dataStatusLabel[dialog.status]}: ${dataKindLabel[dialog.item.kind]} for ${dialog.item.tenantName}`}
            </DialogTitle>
            <DialogDescription>
              {dialog?.status === DataRequestStatus.Completed &&
              dialog.item.kind === DataRequestKind.Delete
                ? "The shop is closed now and everyone is signed out. Data is kept for the retention period (DataRetentionDaysAfterClose), then purged by a DBA."
                : dialog?.status === DataRequestStatus.Completed
                  ? "Upload the export somewhere private and paste a time-limited link."
                  : dialog?.status === DataRequestStatus.Rejected
                    ? "The shop sees the reason."
                    : "Marks the request as being worked on."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {isExportComplete && (
              <div className="space-y-1.5">
                <Label>Download link</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>
                {dialog?.status === DataRequestStatus.Rejected
                  ? "Reason"
                  : "Note (optional, shown to the shop)"}
              </Label>
              <Input
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={
                dialog?.status === DataRequestStatus.Rejected ||
                dialog?.item.kind === DataRequestKind.Delete
                  ? "destructive"
                  : "default"
              }
              disabled={
                m.process.isPending ||
                (dialog?.status === DataRequestStatus.Rejected &&
                  !note.trim()) ||
                (isExportComplete && !url.trim())
              }
              onClick={() =>
                dialog &&
                m.process.mutate(
                  {
                    id: dialog.item.id,
                    body: {
                      status: dialog.status,
                      resultUrl: url.trim() || undefined,
                      adminNote: note.trim() || undefined,
                      rowVersion: dialog.item.rowVersion,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("Saved");
                      setDialog(null);
                    },
                    onError: (e) => applyProblem(e),
                  },
                )
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

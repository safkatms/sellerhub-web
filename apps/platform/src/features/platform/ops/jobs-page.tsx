"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@sellerhub/ui/components/badge";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sellerhub/ui/components/dialog";
import { DataTable } from "@sellerhub/ui/data-table";
import { applyProblem } from "@sellerhub/api-client/errors";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { Perm, useCan } from "@/features/platform/roles/api";
import {
  JobStatus,
  jobStatusLabel,
  useJobRunDetails,
  useJobRuns,
  useJobs,
  useRunJob,
} from "./api";
import { jobRunColumns } from "./columns";

const select = "h-9 rounded-md border bg-background px-2 text-sm";
const pageSize = 20;

export function JobsPage() {
  const can = useCan();
  const canOps = can(Perm.OpsManage);
  const { data: jobs } = useJobs(true);
  const [jobName, setJobName] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const { data: runs, isLoading } = useJobRuns(
    { page, pageSize, jobName },
    true,
  );
  const run = useRunJob();
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const { data: details } = useJobRunDetails(detailsId);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {jobs?.map((j) => (
          <Card key={j.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <code>{j.name}</code>
                {j.lastRun && (
                  <Badge
                    variant={
                      j.lastRun.status === JobStatus.Failed
                        ? "destructive"
                        : j.lastRun.status === JobStatus.Running
                          ? "secondary"
                          : "default"
                    }
                  >
                    {jobStatusLabel[j.lastRun.status]}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {j.description} · {j.schedule}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {j.lastRun ? (
                  <>
                    Last: {fmtDate(j.lastRun.startedAtUtc)}
                    {j.lastRun.message ? ` · ${j.lastRun.message}` : ""}
                  </>
                ) : (
                  "Never ran"
                )}
              </span>
              {canOps && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={run.isPending}
                  onClick={() =>
                    run.mutate(j.name, {
                      onSuccess: (r) =>
                        r.status === JobStatus.Failed
                          ? toast.error(`Failed: ${r.message}`)
                          : toast.success(r.message ?? "Done"),
                      onError: (e) => applyProblem(e),
                    })
                  }
                >
                  Run now
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          <select
            className={select}
            value={jobName ?? ""}
            onChange={(e) => {
              setJobName(e.target.value || undefined);
              setPage(1);
            }}
          >
            <option value="">All jobs</option>
            {jobs?.map((j) => (
              <option key={j.name} value={j.name}>
                {j.name}
              </option>
            ))}
          </select>
        </div>
        <DataTable
          columns={jobRunColumns(canOps, setDetailsId)}
          data={runs?.items ?? []}
          loading={isLoading}
          total={runs?.totalCount ?? 0}
          page={page}
          pageSize={pageSize}
          sorting={[]}
          onPageChange={setPage}
          onSortingChange={() => {}}
        />
      </div>

      <Dialog
        open={detailsId !== null}
        onOpenChange={(o) => !o && setDetailsId(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Failure details</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
            {details ?? "No details."}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

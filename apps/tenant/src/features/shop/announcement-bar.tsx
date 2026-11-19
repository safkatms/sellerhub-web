"use client";

import { X } from "lucide-react";
import { Button } from "@sellerhub/ui/components/button";
import { applyProblem } from "@sellerhub/api-client/errors";
import { Severity, useAnnouncements, useDismissAnnouncement, usePlatformStatus } from "./api";

const tone: Record<number, string> = {
  [Severity.Info]: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
  [Severity.Warning]: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  [Severity.Critical]: "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100",
};

/** Platform announcements and maintenance notice at the top of every shop page. */
export function AnnouncementBar() {
  const { data: status } = usePlatformStatus();
  const { data } = useAnnouncements();
  const dismiss = useDismissAnnouncement();

  return (
    <div className="mb-4 space-y-2 empty:hidden">
      {status?.maintenanceMode && (
        <div role="alert" className={`rounded-md border p-3 text-sm ${tone[Severity.Critical]}`}>
          <b>Maintenance:</b> {status.maintenanceMessage ?? "SellerHub is under maintenance."}
        </div>
      )}
      {data?.map((a) => (
        <div key={a.id} role={a.severity === Severity.Critical ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-md border p-3 text-sm ${tone[a.severity] ?? tone[Severity.Info]}`}>
          <div className="flex-1">
            <div className="font-semibold">{a.title}</div>
            <p className="whitespace-pre-wrap">{a.body}</p>
          </div>
          {a.isDismissible && (
            <Button size="icon" variant="ghost" className="size-7 shrink-0" aria-label="Dismiss" disabled={dismiss.isPending}
              onClick={() => dismiss.mutate(a.id, { onError: (e) => applyProblem(e) })}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

/** For the login / register pages: maintenance and sign-up status before signing in. */
export function PlatformStatusNotice({ forSignup = false }: { forSignup?: boolean }) {
  const { data: status } = usePlatformStatus();
  if (!status) return null;
  const text = status.maintenanceMode
    ? status.maintenanceMessage ?? "SellerHub is under maintenance."
    : forSignup && !status.signupEnabled ? "New shop registration is closed right now." : null;
  if (!text) return null;
  return (
    <div role="alert" className={`fixed inset-x-0 top-0 z-50 border-b p-3 text-center text-sm ${tone[Severity.Warning]}`}>{text}</div>
  );
}

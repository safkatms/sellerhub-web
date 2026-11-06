"use client";
import { Button } from "@sellerhub/ui/components/button";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { useImpersonationStore } from "./store";

/** Shown on every screen while a platform admin is acting as a shop user. */
export function ImpersonationBanner() {
  const { accessToken, userName, expiresAtUtc, end } = useImpersonationStore();
  if (!accessToken) return null;
  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
    >
      <span>
        Impersonating <strong>{userName ?? "shop user"}</strong>
        {expiresAtUtc && <> · ends {fmtDate(expiresAtUtc)}</>}. Actions are audited.
      </span>
      <Button size="sm" variant="outline" onClick={end}>
        End impersonation
      </Button>
    </div>
  );
}

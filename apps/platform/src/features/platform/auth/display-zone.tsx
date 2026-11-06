"use client";
import { useSyncExternalStore } from "react";
import { getDisplayZone, subscribeDisplayZone } from "@sellerhub/ui/lib/dayjs";

/**
 * `fmtDate` reads the display zone from a module variable, so nothing re-renders when it changes.
 * Re-keying the subtree on a zone change reformats dates that are already on screen.
 */
export function DisplayZoneProvider({ children }: { children: React.ReactNode }) {
  const zone = useSyncExternalStore(subscribeDisplayZone, getDisplayZone, getDisplayZone);
  return <div key={zone} className="contents">{children}</div>;
}

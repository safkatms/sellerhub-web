"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { useImpersonationStore } from "./store";

/**
 * Landing page for "Impersonate" in the platform app, which opens
 *   /impersonate#token=<jwt>&expiresIn=<seconds>&name=<user name>&tz=<shop IANA zone>
 * in a new tab. The token travels in the URL fragment, which browsers never send to a server.
 * It is moved into this tab's sessionStorage and the fragment is wiped from the address bar and history.
 * Without a token (link opened by hand) it just continues to the app as normal.
 */
export function ImpersonatePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    // Strict Mode runs effects twice; the fragment is gone after the first run.
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
    const accessToken = params.get("token");
    if (accessToken) {
      const expiresIn = Number(params.get("expiresIn"));
      qc.clear();
      useImpersonationStore.getState().start({
        accessToken,
        userName: params.get("name"),
        timeZone: params.get("tz"),
        expiresAtUtc: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      });
    }
    router.replace("/dashboard");
  }, [qc, router]);

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <Spinner />
    </main>
  );
}

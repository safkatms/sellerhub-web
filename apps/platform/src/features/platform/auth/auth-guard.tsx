"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@sellerhub/ui/components/sellerhub-spinner";
import { useAuthHydrated, useAuthStore } from "./store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) return <PageSpinner />;
  return <>{children}</>;
}

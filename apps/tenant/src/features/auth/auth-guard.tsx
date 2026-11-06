"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@sellerhub/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sellerhub/ui/components/card";
import { useActiveSession, useAuthHydrated } from "./store";

const changePasswordPath = "/change-password";

/**
 * Client-side gate for the authenticated area: renders nothing until a session is known to exist.
 * Users created with a temporary password are held on the change-password screen.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const hydrated = useAuthHydrated();
  const { token, ended, user } = useActiveSession();
  const mustChangePassword = Boolean(user?.mustChangePassword);

  useEffect(() => {
    if (!hydrated || ended) return;
    if (!token) router.replace("/login");
    else if (mustChangePassword && path !== changePasswordPath) router.replace(changePasswordPath);
  }, [hydrated, ended, token, mustChangePassword, path, router]);

  if (!hydrated) return null;
  if (ended) return <ImpersonationEnded />;
  if (!token || (mustChangePassword && path !== changePasswordPath)) return null;
  return children;
}

function ImpersonationEnded() {
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Impersonation ended</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            This tab was opened from the platform console and its session is over. Close this tab, or start a
            new impersonation from the platform app.
          </p>
          <Button variant="outline" className="w-full" nativeButton={false} render={<Link href="/login" />}>
            Sign in as a shop user instead
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

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
import { Input } from "@sellerhub/ui/components/input";
import { Label } from "@sellerhub/ui/components/label";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useMyAccess } from "../roles/api";
import { useTwoFactor } from "./api";

/** The signed-in admin's two-factor (TOTP) settings. */
export function SecurityPage() {
  const { data: access } = useMyAccess();
  const twoFactor = useTwoFactor();
  const [setup, setSetup] = useState<{
    secret: string;
    otpAuthUri: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const enabled = access?.twoFactorEnabled ?? false;
  const codeOk = /^\d{6}$/.test(code.trim());

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Two-factor authentication
            <Badge variant={enabled ? "default" : "outline"}>
              {enabled ? "On" : "Off"}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            After your password, sign-in asks for a 6-digit code from an
            authenticator app (Google Authenticator, Microsoft Authenticator,
            1Password...).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!enabled && !setup && (
            <Button
              disabled={twoFactor.setup.isPending}
              onClick={() =>
                twoFactor.setup.mutate(undefined, {
                  onSuccess: setSetup,
                  onError: (e) => applyProblem(e),
                })
              }
            >
              Set up two-factor
            </Button>
          )}

          {!enabled && setup && (
            <div className="space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>
                  In your authenticator app choose{" "}
                  <b>Add account → Enter a setup key</b>.
                </li>
                <li>
                  Account: your email. Key:
                  <code className="ml-2 rounded bg-muted px-2 py-1 font-mono text-sm tracking-wider select-all">
                    {setup.secret}
                  </code>
                </li>
                <li>
                  On a phone you can also open this link:{" "}
                  <a className="underline" href={setup.otpAuthUri}>
                    add to authenticator
                  </a>
                  .
                </li>
                <li>Type the 6-digit code the app shows.</li>
              </ol>
              <div className="flex max-w-sm gap-2">
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button
                  disabled={!codeOk || twoFactor.enable.isPending}
                  onClick={() =>
                    twoFactor.enable.mutate(code.trim(), {
                      onSuccess: () => {
                        toast.success("Two-factor is on");
                        setSetup(null);
                        setCode("");
                      },
                      onError: (e) => applyProblem(e),
                    })
                  }
                >
                  Turn on
                </Button>
              </div>
            </div>
          )}

          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="disable-code">
                To turn it off, enter a current code
              </Label>
              <div className="flex max-w-sm gap-2">
                <Input
                  id="disable-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button
                  variant="destructive"
                  disabled={!codeOk || twoFactor.disable.isPending}
                  onClick={() =>
                    twoFactor.disable.mutate(code.trim(), {
                      onSuccess: () => {
                        toast.success("Two-factor is off");
                        setCode("");
                      },
                      onError: (e) => applyProblem(e),
                    })
                  }
                >
                  Turn off
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Lost your phone? Ask a super admin to reset your two-factor.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sellerhub/ui/components/card";
import { Checkbox } from "@sellerhub/ui/components/checkbox";
import { Spinner } from "@sellerhub/ui/components/spinner";
import { applyProblem } from "@sellerhub/api-client/errors";
import {
  useFeatures,
  usePlanFeatures,
  useSetPlanFeatures,
} from "@/features/platform/entitlements/api";

/** Which features shops on this plan get. Per-shop exceptions live on the shop's "Limits & Features" tab. */
export function PlanFeaturesCard({ planId }: { planId: number }) {
  const { data: catalog, isLoading: catalogLoading } = useFeatures();
  const { data: current, isLoading: currentLoading } = usePlanFeatures(planId);
  const save = useSetPlanFeatures(planId);
  // null = not edited yet, show the server's set.
  const [draft, setDraft] = useState<Set<string> | null>(null);

  if (catalogLoading || currentLoading)
    return <Spinner className="mx-auto mt-6 size-6" />;

  const selected = draft ?? new Set(current ?? []);
  const toggle = (code: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(code);
    else next.delete(code);
    setDraft(next);
  };

  // Group by module for a readable list.
  const groups = new Map<string, NonNullable<typeof catalog>>();
  for (const f of catalog ?? []) {
    if (!f.isActive && !selected.has(f.code)) continue;
    groups.set(f.module, [...(groups.get(f.module) ?? []), f]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <p className="text-sm text-muted-foreground">
          Shops on this plan get the checked features. Individual shops can
          still be overridden.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.size === 0 && (
          <p className="text-sm text-muted-foreground">
            No features in the catalog.
          </p>
        )}
        {[...groups.entries()].map(([module, items]) => (
          <div key={module} className="space-y-2">
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {module}
            </div>
            {items.map((f) => (
              <label key={f.code} className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={selected.has(f.code)}
                  onCheckedChange={(c) => toggle(f.code, c === true)}
                />
                <span>
                  <span className="font-medium">{f.name}</span>
                  {!f.isActive && (
                    <span className="text-muted-foreground"> (inactive)</span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    {f.code}
                    {f.description ? ` · ${f.description}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            disabled={draft === null || save.isPending}
            onClick={() =>
              save.mutate([...selected], {
                onSuccess: () => {
                  setDraft(null);
                  toast.success("Plan features saved");
                },
                onError: (e) => applyProblem(e),
              })
            }
          >
            Save features
          </Button>
          {draft !== null && (
            <Button variant="outline" onClick={() => setDraft(null)}>
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

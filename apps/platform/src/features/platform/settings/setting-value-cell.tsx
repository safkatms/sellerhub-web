"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import { Input } from "@sellerhub/ui/components/input";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useAuthStore } from "@/features/platform/auth/store";
import { useUpdateSetting, type PlatformSetting } from "./api";
import { TimeZoneSelect } from "@sellerhub/ui/time-zone-select";

const TIME_ZONE_KEY = "PlatformTimeZone";

/** Inline editor for one platform setting value. */
export function SettingValueCell({ setting }: { setting: PlatformSetting }) {
  const [value, setValue] = useState(setting.value);
  const update = useUpdateSetting();
  const dirty = value !== setting.value;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {setting.key === TIME_ZONE_KEY ? (
        <TimeZoneSelect value={value} onChange={setValue} />
      ) : (
        <Input value={value} onChange={(event) => setValue(event.target.value)} />
      )}
      <Button
        size="sm"
        className="shrink-0"
        disabled={!dirty || update.isPending}
        onClick={() =>
          update.mutate(
            { key: setting.key, value },
            {
              onSuccess: (saved) => {
                // The console zone follows this setting immediately (it is otherwise refreshed at login).
                if (saved.key === TIME_ZONE_KEY) useAuthStore.getState().setTimeZone(saved.value);
                toast.success("Saved");
              },
              onError: (error) => applyProblem(error),
            },
          )
        }
      >
        Save
      </Button>
    </div>
  );
}

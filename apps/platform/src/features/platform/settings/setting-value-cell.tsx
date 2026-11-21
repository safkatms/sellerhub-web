"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@sellerhub/ui/components/button";
import { Input } from "@sellerhub/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sellerhub/ui/components/select";
import { TimeZoneSelect } from "@sellerhub/ui/time-zone-select";
import { applyProblem } from "@sellerhub/api-client/errors";
import { useAuthStore } from "@/features/platform/auth/store";
import { usePlans } from "@/features/platform/plans/api";
import { useUpdateSetting, type PlatformSetting } from "./api";
import { settingKind, type SettingKind } from "./labels";

const TIME_ZONE_KEY = "PlatformTimeZone";

/** Returns an error message, or null when the value is acceptable. */
function validate(kind: SettingKind, v: string): string | null {
  const t = v.trim();
  switch (kind.type) {
    case "int": {
      if (!/^\d+$/.test(t)) return "Whole number";
      const n = Number(t);
      if (kind.min != null && n < kind.min) return `Min ${kind.min}`;
      if (kind.max != null && n > kind.max) return `Max ${kind.max}`;
      return null;
    }
    case "decimal": {
      if (!/^\d+(\.\d+)?$/.test(t)) return "Number";
      return kind.min != null && Number(t) < kind.min
        ? `Min ${kind.min}`
        : null;
    }
    case "days-list":
      return /^\d+(\s*,\s*\d+)*$/.test(t) ? null : "e.g. 7,3,1,0";
    case "plan":
    case "timezone":
      return t ? null : "Required";
    case "bool":
      return t === "true" || t === "false" ? null : "true or false";
    default:
      return null;
  }
}

/** Inline editor for one platform setting; the input type follows the setting. */
export function SettingValueCell({ setting }: { setting: PlatformSetting }) {
  const kind = settingKind(setting.key);
  const [value, setValue] = useState(setting.value);
  const update = useUpdateSetting();
  const { data: plans } = usePlans();

  useEffect(() => {
    setValue(setting.value);
  }, [setting.key, setting.value]);

  const planItems = useMemo(() => {
    const items: Record<string, string> = {};
    plans
      ?.filter((p) => p.isActive || p.code === setting.value)
      .forEach((p) => (items[p.code] = `${p.name} (${p.code})`));
    if (setting.value && !items[setting.value])
      items[setting.value] = setting.value;
    return items;
  }, [plans, setting.value]);

  const dirty = value !== setting.value;
  const error = dirty ? validate(kind, value) : null;

  const save = () =>
    update.mutate(
      {
        key: setting.key,
        value: kind.type === "textarea" ? value : value.trim(),
      },
      {
        onSuccess: (saved) => {
          if (saved.key === TIME_ZONE_KEY)
            useAuthStore.getState().setTimeZone(saved.value);
          toast.success("Saved");
        },
        onError: (e) => applyProblem(e),
      },
    );

  const field = (() => {
    switch (kind.type) {
      case "bool":
        return (
          <Select
            items={{ true: "On (true)", false: "Off (false)" }}
            value={value}
            onValueChange={(v) => v != null && setValue(v)}
          >
            <SelectTrigger className="w-full min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">On (true)</SelectItem>
              <SelectItem value="false">Off (false)</SelectItem>
            </SelectContent>
          </Select>
        );
      case "plan":
        return (
          <Select
            items={planItems}
            value={value}
            onValueChange={(v) => v != null && setValue(v)}
          >
            <SelectTrigger className="w-full min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(planItems).map(([code, label]) => (
                <SelectItem key={code} value={code}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "timezone":
        return <TimeZoneSelect value={value} onChange={setValue} />;
      case "int":
        return (
          <Input
            type="number"
            inputMode="numeric"
            step={1}
            min={kind.min}
            max={kind.max}
            className="min-w-28"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      case "decimal":
        return (
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={kind.min}
            className="min-w-28"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      case "days-list":
        return (
          <Input
            placeholder="7,3,1,0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      case "textarea":
        return (
          <textarea
            rows={2}
            className="min-h-16 w-full min-w-56 rounded-md border bg-background p-2 text-sm"
            placeholder={kind.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      default:
        return (
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        );
    }
  })();

  return (
    <div className="space-y-1">
      <div
        className={`flex min-w-0 gap-2 ${kind.type === "textarea" ? "items-start" : "items-center"}`}
      >
        <div className="min-w-0 flex-1">{field}</div>
        <Button
          size="sm"
          className="shrink-0"
          disabled={!dirty || !!error || update.isPending}
          onClick={save}
        >
          Save
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

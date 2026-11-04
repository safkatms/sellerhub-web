"use client";
import { useMemo } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Zone = { id: string; label: string; offsetMinutes: number };
type Region = { name: string; zones: Zone[] };

const offsetText = (zone: string, at: Date) => {
  try {
    const part = new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "longOffset",
    })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value;
    const text = (part ?? "GMT").replace("GMT", "UTC");
    return text === "UTC" ? "UTC+00:00" : text;
  } catch {
    return "";
  }
};

const toMinutes = (text: string) => {
  const m = /UTC([+-])(\d{2}):(\d{2})/.exec(text);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
};

const describe = (id: string, at: Date): Zone => {
  const off = offsetText(id, at);
  return {
    id,
    label: `${id.split("/").slice(1).join("/").replaceAll("_", " ") || id} (${off})`,
    offsetMinutes: toMinutes(off),
  };
};

/** Groups IANA ids by their first segment ("Asia/Dhaka" -> Asia). Ids without a region (UTC) go under "Other". */
function buildRegions(current: string): Region[] {
  const ids = new Set<string>(["UTC", ...Intl.supportedValuesOf("timeZone")]);
  if (current) ids.add(current); // keep an unknown/legacy stored value selectable
  const now = new Date();
  const byRegion = new Map<string, Zone[]>();
  for (const id of ids) {
    const region = id.includes("/") ? id.split("/")[0] : "Other";
    const zone =
      region === "Other"
        ? { ...describe(id, now), label: `${id} (${offsetText(id, now)})` }
        : describe(id, now);
    byRegion.set(region, [...(byRegion.get(region) ?? []), zone]);
  }
  return [...byRegion]
    .map(([name, zones]) => ({
      name,
      zones: zones.sort(
        (a, b) => a.offsetMinutes - b.offsetMinutes || a.id.localeCompare(b.id),
      ),
    }))
    .sort((a, b) =>
      a.name === "Other"
        ? 1
        : b.name === "Other"
          ? -1
          : a.name.localeCompare(b.name),
    );
}

/** IANA time-zone picker built on the shared dropdown menu: regions open submenus of zones with their current UTC offset. */
export function TimeZoneSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (zone: string) => void;
  className?: string;
}) {
  const regions = useMemo(() => buildRegions(value), [value]);
  const selected = useMemo(
    () => regions.flatMap((r) => r.zones).find((z) => z.id === value),
    [regions, value],
  );

  return (
    // The wrapper is empty in flow (the trigger is absolutely positioned), so the label can never widen a table
    // column or a flex row: the width always comes from the surrounding layout, like a plain <Input>.
    <div className={cn("relative h-9 min-w-0 flex-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              className="absolute inset-0 h-full w-full justify-between gap-2 overflow-hidden font-normal"
            />
          }
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {value}
            {selected && (
              <span className="ml-1 text-muted-foreground">
                {selected.label.match(/\(.*\)$/)?.[0]}
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56">
          {regions.map((region) => (
            <DropdownMenuSub key={region.name}>
              <DropdownMenuSubTrigger>{region.name}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 min-w-64 overflow-y-auto">
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                  {region.zones.map((zone) => (
                    <DropdownMenuRadioItem key={zone.id} value={zone.id}>
                      {zone.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

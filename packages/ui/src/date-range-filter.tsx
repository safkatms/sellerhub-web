"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "./components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/select";
import {
  rangePresets,
  type DateRangeState,
  type RangePreset,
} from "./lib/date-range";

export const filterTrigger =
  "h-10 min-w-40 gap-2 rounded-xl bg-card px-3 text-sm shadow-sm";

export function DateRangeFilter({ s }: { s: DateRangeState }) {
  return (
    <>
      <Select
        value={s.preset}
        onValueChange={(v) => v && s.setPreset(v as RangePreset)}
      >
        <SelectTrigger className={filterTrigger}>
          <CalendarDays className="h-4 w-4 shrink-0" />
          <SelectValue>{rangePresets[s.preset]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(rangePresets).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {s.preset === "custom" && (
        <>
          <Input
            type="date"
            className="h-10 w-40 rounded-xl bg-card shadow-sm"
            value={s.from}
            max={s.to || undefined}
            onChange={(e) => s.setFrom(e.target.value)}
          />
          <Input
            type="date"
            className="h-10 w-40 rounded-xl bg-card shadow-sm"
            value={s.to}
            min={s.from || undefined}
            onChange={(e) => s.setTo(e.target.value)}
          />
        </>
      )}
    </>
  );
}

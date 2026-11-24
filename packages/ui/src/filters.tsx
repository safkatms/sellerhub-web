"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronDown,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./lib/utils";
import { rangePresets, resolveRange, type RangePreset } from "./lib/date-range";
import { Button } from "./components/button";
import { Checkbox } from "./components/checkbox";
import { Input } from "./components/input";
import { Label } from "./components/label";
import { Popover, PopoverContent, PopoverTrigger } from "./components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/select";

/* ------------------------------------------------------------------ types */

export type Option = { value: string; label: string };
export type AsyncValue = { value: string; label: string };
export type NumberRange = { min: string; max: string };
export type DateValue = { preset: RangePreset; from: string; to: string };

type Base = {
  key: string;
  label?: string;
  icon?: LucideIcon;
  className?: string;
};

export type FilterDef =
  | (Base & { type: "search"; placeholder?: string; delay?: number })
  | (Base & {
      type: "select";
      options: Option[];
      allLabel?: string;
      defaultValue?: string;
    })
  | (Base & { type: "multiselect"; options: Option[]; searchable?: boolean })
  | (Base & { type: "toggle" })
  | (Base & {
      type: "number-range";
      unit?: string;
      minKey?: string;
      maxKey?: string;
    })
  | (Base & {
      type: "date-range";
      fromKey?: string;
      toKey?: string;
      presets?: RangePreset[];
    })
  | (Base & {
      type: "async-select";
      placeholder?: string;
      useOptions: (search: string) => { options: Option[]; loading?: boolean };
    });

type Values = Record<string, unknown>;

const emptyOf = (d: FilterDef): unknown => {
  switch (d.type) {
    case "search":
      return "";
    case "select":
      return d.defaultValue;
    case "multiselect":
      return [] as string[];
    case "toggle":
      return false;
    case "number-range":
      return { min: "", max: "" } satisfies NumberRange;
    case "date-range":
      return { preset: "all", from: "", to: "" } satisfies DateValue;
    case "async-select":
      return undefined;
  }
};

const isEmpty = (d: FilterDef, v: unknown): boolean => {
  switch (d.type) {
    case "search":
      return !(v as string)?.trim();
    case "select":
      return v === d.defaultValue || v == null;
    case "multiselect":
      return !(v as string[])?.length;
    case "toggle":
      return !v;
    case "number-range": {
      const r = v as NumberRange;
      return !r.min && !r.max;
    }
    case "date-range":
      return (v as DateValue).preset === "all";
    case "async-select":
      return v == null;
  }
};

function toParams(d: FilterDef, v: unknown): Record<string, unknown> {
  if (isEmpty(d, v)) return {};
  switch (d.type) {
    case "search":
      return { [d.key]: (v as string).trim() };
    case "select":
      return { [d.key]: v };
    case "multiselect":
      return { [d.key]: v };
    case "toggle":
      return { [d.key]: true };
    case "async-select":
      return { [d.key]: (v as AsyncValue).value };
    case "number-range": {
      const r = v as NumberRange;
      return {
        [d.minKey ?? `${d.key}Min`]: r.min === "" ? undefined : Number(r.min),
        [d.maxKey ?? `${d.key}Max`]: r.max === "" ? undefined : Number(r.max),
      };
    }
    case "date-range": {
      const x = v as DateValue;
      const r = resolveRange(x.preset, x.from, x.to);
      return {
        [d.fromKey ?? "fromUtc"]: r.fromUtc,
        [d.toKey ?? "toUtc"]: r.toUtc,
      };
    }
  }
}

/* ------------------------------------------------------------------- hook */

/** Define `defs` at module level (or memoize) so it stays stable. */
export function useFilters(defs: FilterDef[]) {
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(defs.map((d) => [d.key, emptyOf(d)])),
  );

  const set = (key: string, v: unknown) =>
    setValues((p) => ({ ...p, [key]: v }));
  const reset = () =>
    setValues(Object.fromEntries(defs.map((d) => [d.key, emptyOf(d)])));

  const params = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const d of defs) Object.assign(out, toParams(d, values[d.key]));
    return out;
  }, [defs, values]);

  const active = defs.filter((d) => !isEmpty(d, values[d.key])).length;
  // Use as an effect dependency to reset paging: useEffect(() => setPage(1), [paramsKey])
  const paramsKey = JSON.stringify(params);

  return {
    defs,
    values,
    set,
    reset,
    params,
    paramsKey,
    active,
    isActive: active > 0,
  };
}
export type FiltersState = ReturnType<typeof useFilters>;

/* ------------------------------------------------------------- primitives */

export const filterTrigger =
  "h-10 min-w-40 justify-between gap-2 rounded-xl bg-card px-3 text-sm shadow-sm";
const field = "h-10 rounded-xl bg-card shadow-sm";

function SearchField({
  d,
  value,
  onChange,
}: {
  d: Extract<FilterDef, { type: "search" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), d.delay ?? 350);
    return () => clearTimeout(t);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={cn("relative w-full max-w-sm", d.className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={cn(field, "pl-9")}
        placeholder={d.placeholder ?? "Search…"}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
    </div>
  );
}

function SelectField({
  d,
  value,
  onChange,
}: {
  d: Extract<FilterDef, { type: "select" }>;
  value?: string;
  onChange: (v?: string) => void;
}) {
  const Icon = d.icon;
  const current =
    d.options.find((o) => o.value === value)?.label ??
    d.allLabel ??
    d.label ??
    "";
  return (
    <Select
      value={value ?? "__all"}
      onValueChange={(v) => onChange(!v || v === "__all" ? undefined : v)}
    >
      <SelectTrigger className={cn(filterTrigger, d.className)}>
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <SelectValue>{current}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {d.allLabel && <SelectItem value="__all">{d.allLabel}</SelectItem>}
        {d.options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PopoverField({
  d,
  summary,
  children,
}: {
  d: Base;
  summary: ReactNode;
  children: ReactNode;
}) {
  const Icon = d.icon;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center rounded-md border text-left",
          filterTrigger,
          d.className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className="truncate">{summary}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2 p-2">{children}</PopoverContent>
    </Popover>
  );
}

function MultiField({
  d,
  value,
  onChange,
}: {
  d: Extract<FilterDef, { type: "multiselect" }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const shown = d.options.filter((o) =>
    o.label.toLowerCase().includes(q.toLowerCase()),
  );
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <PopoverField
      d={d}
      summary={
        value.length === 0
          ? d.label
          : value.length === 1
            ? d.options.find((o) => o.value === value[0])?.label
            : `${d.label} · ${value.length}`
      }
    >
      {d.searchable && (
        <Input
          className="h-9"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}
      <div className="max-h-60 space-y-0.5 overflow-auto">
        {shown.map((o) => (
          <Label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Checkbox
              checked={value.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
            />
            {o.label}
          </Label>
        ))}
        {shown.length === 0 && (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            No results
          </div>
        )}
      </div>
      {value.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onChange([])}
        >
          Clear
        </Button>
      )}
    </PopoverField>
  );
}

function AsyncField({
  d,
  value,
  onChange,
}: {
  d: Extract<FilterDef, { type: "async-select" }>;
  value?: AsyncValue;
  onChange: (v?: AsyncValue) => void;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { options, loading } = d.useOptions(debounced);
  return (
    <PopoverField d={d} summary={value?.label ?? d.placeholder ?? d.label}>
      <Input
        className="h-9"
        placeholder="Type to search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="max-h-60 overflow-auto">
        {loading && (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}
        {!loading && options.length === 0 && (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            No results
          </div>
        )}
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
              value?.value === o.value && "bg-secondary",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onChange(undefined)}
        >
          Clear
        </Button>
      )}
    </PopoverField>
  );
}

function DateField({
  d,
  value,
  onChange,
}: {
  d: Extract<FilterDef, { type: "date-range" }>;
  value: DateValue;
  onChange: (v: DateValue) => void;
}) {
  const keys = d.presets ?? (Object.keys(rangePresets) as RangePreset[]);
  return (
    <>
      <Select
        value={value.preset}
        onValueChange={(v) =>
          v && onChange({ ...value, preset: v as RangePreset })
        }
      >
        <SelectTrigger className={cn(filterTrigger, d.className)}>
          <CalendarDays className="h-4 w-4 shrink-0" />
          <SelectValue>{rangePresets[value.preset]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {keys.map((k) => (
            <SelectItem key={k} value={k}>
              {rangePresets[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.preset === "custom" && (
        <>
          <Input
            type="date"
            className={cn(field, "w-40")}
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
          <Input
            type="date"
            className={cn(field, "w-40")}
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </>
      )}
    </>
  );
}

/* -------------------------------------------------------------- component */

export function Filters({
  filters,
  className,
  showReset = true,
}: {
  filters: FiltersState;
  className?: string;
  showReset?: boolean;
}) {
  const { defs, values, set, reset, isActive } = filters;
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {defs.map((d) => {
        const v = values[d.key];
        switch (d.type) {
          case "search":
            return (
              <SearchField
                key={d.key}
                d={d}
                value={v as string}
                onChange={(x) => set(d.key, x)}
              />
            );
          case "select":
            return (
              <SelectField
                key={d.key}
                d={d}
                value={v as string | undefined}
                onChange={(x) => set(d.key, x)}
              />
            );
          case "multiselect":
            return (
              <MultiField
                key={d.key}
                d={d}
                value={v as string[]}
                onChange={(x) => set(d.key, x)}
              />
            );
          case "async-select":
            return (
              <AsyncField
                key={d.key}
                d={d}
                value={v as AsyncValue | undefined}
                onChange={(x) => set(d.key, x)}
              />
            );
          case "date-range":
            return (
              <DateField
                key={d.key}
                d={d}
                value={v as DateValue}
                onChange={(x) => set(d.key, x)}
              />
            );
          case "toggle":
            return (
              <Label
                key={d.key}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm shadow-sm",
                  d.className,
                )}
              >
                <Checkbox
                  checked={Boolean(v)}
                  onCheckedChange={(c) => set(d.key, c === true)}
                />
                {d.label}
              </Label>
            );
          case "number-range": {
            const r = v as NumberRange;
            return (
              <div key={d.key} className="flex items-center gap-2">
                <Input
                  type="number"
                  className={cn(field, "w-28")}
                  placeholder={`Min${d.unit ? ` ${d.unit}` : ""}`}
                  value={r.min}
                  onChange={(e) => set(d.key, { ...r, min: e.target.value })}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  className={cn(field, "w-28")}
                  placeholder={`Max${d.unit ? ` ${d.unit}` : ""}`}
                  value={r.max}
                  onChange={(e) => set(d.key, { ...r, max: e.target.value })}
                />
              </div>
            );
          }
        }
      })}
      {showReset && isActive && (
        <Button variant="ghost" className="h-10 rounded-xl" onClick={reset}>
          <X className="mr-1 h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}

import dayjs, { getDisplayZone } from "./dayjs";

export const rangePresets = {
    all: "All time",
    today: "Today",
    yesterday: "Yesterday",
    this_week: "This week",
    last_7: "Last 7 days",
    this_month: "This month",
    last_month: "Last month",
    this_year: "This year",
    custom: "Custom range",
} as const;
export type RangePreset = keyof typeof rangePresets;

export function resolveRange(
    preset: RangePreset,
    customFrom?: string,
    customTo?: string,
): { fromUtc?: string; toUtc?: string } {
    const z = getDisplayZone();
    const now = dayjs().tz(z);
    const iso = (d: ReturnType<typeof dayjs>) => d.utc().toISOString();
    const day = now.startOf("day");

    switch (preset) {
        case "today": return { fromUtc: iso(day), toUtc: iso(day.add(1, "day")) };
        case "yesterday": return { fromUtc: iso(day.subtract(1, "day")), toUtc: iso(day) };
        case "this_week": return { fromUtc: iso(now.startOf("week")), toUtc: iso(now.startOf("week").add(1, "week")) };
        case "last_7": return { fromUtc: iso(day.subtract(6, "day")), toUtc: iso(day.add(1, "day")) };
        case "this_month": return { fromUtc: iso(now.startOf("month")), toUtc: iso(now.startOf("month").add(1, "month")) };
        case "last_month": return { fromUtc: iso(now.startOf("month").subtract(1, "month")), toUtc: iso(now.startOf("month")) };
        case "this_year": return { fromUtc: iso(now.startOf("year")), toUtc: iso(now.startOf("year").add(1, "year")) };
        case "custom": return {
            fromUtc: customFrom ? iso(dayjs.tz(customFrom, z).startOf("day")) : undefined,
            toUtc: customTo ? iso(dayjs.tz(customTo, z).startOf("day").add(1, "day")) : undefined,
        };
        default: return {};
    }
}

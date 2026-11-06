import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(relativeTime);

/** The browser's own zone. Only a fallback until the server's PlatformTimeZone is known. */
export const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

let displayZone = browserZone();
const listeners = new Set<() => void>();

/** Zone used by `fmtDate` when none is passed. Set from the PlatformTimeZone setting; null/empty falls back to the browser zone. */
export function setDisplayZone(next: string | null | undefined) {
    const zone = next || browserZone();
    if (zone === displayZone) return;
    displayZone = zone;
    listeners.forEach((l) => l());
}

export const getDisplayZone = () => displayZone;
export const subscribeDisplayZone = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
};

export const fmtDate = (utcStr?: string | null, zone = displayZone) =>
    utcStr ? dayjs.utc(utcStr).tz(zone).format("DD MMM YYYY, hh:mm A") : "-";

export default dayjs;

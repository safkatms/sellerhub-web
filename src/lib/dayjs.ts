import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(relativeTime);

export const fmtDate = (utcStr?: string | null, zone = "Asia/Dhaka") =>
    utcStr ? dayjs.utc(utcStr).tz(zone).format("DD MMM YYYY, hh:mm A") : "-";

export default dayjs;
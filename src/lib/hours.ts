import { TIME_ZONE, type Store } from "./site";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** 450 -> "7:30am", 900 -> "3pm" */
export function clock(mins: number) {
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${hh < 12 ? "am" : "pm"}`;
}

/** Day of week and minutes after midnight in the shops' time zone. */
export function shopTime(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, mins: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus = {
  open: boolean;
  /** "Open now" or "Closed" */
  state: string;
  /** "closes 3pm", "opens 7:30am", "opens Monday 7:30am" */
  detail: string;
  closingSoon: boolean;
};

export function openStatus(store: Store, now: Date): OpenStatus {
  const { day, mins } = shopTime(now);
  const today = store.hours[day];

  if (today && mins >= today.open && mins < today.close) {
    return {
      open: true,
      state: "Open now",
      detail: `closes ${clock(today.close)}`,
      closingSoon: today.close - mins <= 30,
    };
  }
  if (today && mins < today.open) {
    return { open: false, state: "Closed", detail: `opens ${clock(today.open)}`, closingSoon: false };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const next = store.hours[d];
    if (next) {
      const when = i === 1 ? "tomorrow" : DAY_NAMES[d];
      return { open: false, state: "Closed", detail: `opens ${when} ${clock(next.open)}`, closingSoon: false };
    }
  }
  return { open: false, state: "Closed", detail: "", closingSoon: false };
}

const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The open days as a range, read from the hours table: "Mon–Sat" (short) or
 * "Monday to Saturday". Week runs Monday first. Falls back to a list when the
 * open days aren't one unbroken run.
 */
export function openDays(store: Store, short = true) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const open = order.filter((d) => store.hours[d]);
  const names = short ? SHORT : DAY_NAMES;
  if (!open.length) return "";
  const run = order.indexOf(open[open.length - 1]) - order.indexOf(open[0]) + 1 === open.length;
  if (open.length === 1) return names[open[0]];
  return run ? `${names[open[0]]}${short ? "–" : " to "}${names[open[open.length - 1]]}` : open.map((d) => names[d]).join(", ");
}

/** "Mon–Sat 7:30am–3pm", from the first open day's hours. */
export function hoursShort(store: Store) {
  const first = store.hours.find(Boolean);
  return first ? `${openDays(store)} ${clock(first.open)}–${clock(first.close)}` : "Closed";
}

/** "Monday to Saturday, 7:30am to 3pm. Closed Sunday." built from the hours table. */
export function hoursSummary(store: Store) {
  const first = store.hours.find(Boolean);
  if (!first) return "Closed";
  const closed = [1, 2, 3, 4, 5, 6, 0].filter((d) => !store.hours[d]).map((d) => DAY_NAMES[d]);
  return `${openDays(store, false)}, ${clock(first.open)} to ${clock(first.close)}.${closed.length ? ` Closed ${closed.join(", ")}.` : ""}`;
}

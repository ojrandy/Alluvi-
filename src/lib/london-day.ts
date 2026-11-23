/**
 * Calendar-day maths in UK time. Timestamps are stored in UTC (CONVENTIONS), but "today" and
 * "the last 7 days" mean London days, which start at 00:00 GMT in winter and 23:00 UTC in summer.
 * A day key is the London calendar date as "YYYY-MM-DD".
 */

const TZ = "Europe/London";

/** en-CA formats as YYYY-MM-DD. */
const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const wallClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const shortLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });

/** London calendar date of an instant, e.g. 2026-07-01T23:30Z → "2026-07-02" (BST). */
export const londonDayKey = (d: Date): string => keyFormat.format(d);

/** The key `n` calendar days after (or before, when negative) `key`. */
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** London's UTC offset in ms at an instant (0 for GMT, 3 600 000 for BST). */
function londonOffsetMs(at: number): number {
  const p = Object.fromEntries(wallClock.formatToParts(at).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(at / 60_000) * 60_000;
}

/**
 * The UTC instant of 00:00 London time on `key`. UK clocks change at 01:00 UTC, never between
 * 23:00 and 00:00 UTC, so the offset at 00:00 UTC on that date is the offset at London midnight.
 */
export function londonMidnight(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  return new Date(utcMidnight - londonOffsetMs(utcMidnight));
}

/** "2026-11-22" → "22 Nov". */
export const formatDayKey = (key: string): string => shortLabel.format(new Date(`${key}T00:00:00Z`));

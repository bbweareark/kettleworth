"use client";
import { useNow } from "./use-now";

/**
 * Dates that render identically on the server and on every phone. Locale formatting is not safe for this: Node writes
 * "14 Sept" where Safari writes "14 Sep", and the server's time zone moves a date across midnight.
 */
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A calendar date (YYYY-MM-DD) as "14 Sep" or "14 September". Read from the string itself, never through a time zone. */
export function dayMonth(isoDate: string, long = false): string {
  const [, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!m || !d) return isoDate;
  return `${d} ${(long ? LONG : SHORT)[m - 1]}`;
}

/** A moment (full ISO timestamp) in the phone's own time zone. Shows the date alone until mounted, then adds the time. */
export function LocalDateTime({ iso, time = true }: { iso: string; time?: boolean }) {
  const now = useNow();
  if (now == null) return <>{dayMonth(iso)}</>;
  const d = new Date(iso);
  const date = `${d.getDate()} ${SHORT[d.getMonth()]}`;
  return <>{time ? `${date}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : date}</>;
}

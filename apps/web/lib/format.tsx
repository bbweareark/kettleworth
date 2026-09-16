"use client";
import { useNow } from "./use-now";
import { dayMonth } from "./dates";
export { dayMonth };
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Dates that render identically on the server and on every phone. Locale formatting is not safe for this: Node writes
 * "14 Sept" where Safari writes "14 Sep", and the server's time zone moves a date across midnight.
 */


/** A moment (full ISO timestamp) in the phone's own time zone. Shows the date alone until mounted, then adds the time. */
export function LocalDateTime({ iso, time = true }: { iso: string; time?: boolean }) {
  const now = useNow();
  if (now == null) return <>{dayMonth(iso)}</>;
  const d = new Date(iso);
  const date = `${d.getDate()} ${SHORT[d.getMonth()]}`;
  return <>{time ? `${date}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : date}</>;
}

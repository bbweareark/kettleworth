import { kgToLb } from "@kettleworth/core";

/**
 * Pure formatting that renders identically on the server and on every phone (no locale, no time zone). Safe to import
 * from server and client components alike.
 */
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A calendar date (YYYY-MM-DD) as "14 Sep" or "14 September", read from the string itself. */
export function dayMonth(isoDate: string, long = false): string {
  const [, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!m || !d) return isoDate;
  return `${d} ${(long ? LONG : SHORT)[m - 1]}`;
}

/** A weight in the lifter's units to one decimal place, or "bw" when there is none. */
export const fmtKg = (kg: number | null | undefined, units: "metric" | "imperial") => (kg == null ? "bw" : String(Math.round((units === "metric" ? kg : kgToLb(kg)) * 10) / 10));

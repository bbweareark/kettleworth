import "server-only";
import { cookies } from "next/headers";

/**
 * The lifter's calendar date, from the time zone their phone reported (kw-tz cookie). The server runs in UTC, so
 * without this a UK evening after 11pm in summer would already be "tomorrow".
 */
export async function localTodayIso(): Promise<string> {
  const tz = (await cookies()).get("kw-tz")?.value;
  try {
    if (tz) return new Intl.DateTimeFormat("en-CA", { timeZone: decodeURIComponent(tz), year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

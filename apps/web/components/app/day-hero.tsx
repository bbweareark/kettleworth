import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Readout } from "@kettleworth/ui";

type Next = { id: string; name: string; scheduledOn: string; estimatedMinutes: number } | null;
const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** "tomorrow", "Thursday" or "Thu 25 Sep", computed from calendar dates only, so the server and the phone agree. */
export function whenLabel(dateIso: string, todayIso: string): string {
  const d = new Date(`${dateIso}T12:00:00Z`), t = new Date(`${todayIso}T12:00:00Z`);
  const days = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (days === 1) return "tomorrow";
  if (days > 1 && days < 7) return WEEKDAY[d.getUTCDay()]!;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${WEEKDAY[d.getUTCDay()]!.slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * Today's session is finished.
 *
 * This used to be a second photographic hero with white type over a gradient. The screen head
 * already carries the photograph, so a panel here would be a second hero competing with the
 * first; what is left is what the lifter actually wants after training - what the session added
 * up to, and what is next.
 */
export function DonePanel({ name, summary, next, todayIso, unit }: { name: string; summary: { sets: number; volumeKg: number; minutes: number | null; records: number } | null; next: Next; todayIso: string; unit: "kg" | "lb" }) {
  const vol = summary ? (unit === "kg" ? summary.volumeKg : Math.round(summary.volumeKg * 2.20462)) : 0;
  return (
    <section aria-label="Today's session is done" className="border-t border-rule pt-4">
      <p className="meta">Done for today</p>
      <h2 className="mt-1 font-display text-2xl">{name}, done.</h2>
      <p className="measure mt-2 text-sm text-fg-muted">The work is in. Eat, sleep, and let it turn into strength.</p>
      {summary ? (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <Readout label="Sets" value={summary.sets} />
          <Readout label="Volume" value={vol.toLocaleString("en-GB")} unit={unit} />
          <Readout label="Minutes" value={summary.minutes != null ? summary.minutes : "–"} />
          <Readout label="Records" value={summary.records} accent={summary.records > 0} note={summary.records > 0 ? "personal best" : undefined} />
        </dl>
      ) : null}
      {next ? (
        <Link href={`/app/session/${next.id}`} className="mt-5 inline-flex items-center gap-1.5 text-sm text-fg transition-colors hover:text-volt">
          Up next: {next.name}, {whenLabel(next.scheduledOn, todayIso)} <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <p className="mt-5 text-sm text-fg-muted">That was the last session of this block.</p>
      )}
    </section>
  );
}

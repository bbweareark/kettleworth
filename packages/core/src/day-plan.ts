/**
 * What a lifter should do today, decided from their sessions and their own calendar date. One rule for every surface
 * (Today, the quest board, the programme) so the app never says two different things.
 *
 * - A session opened but never logged is not "in progress"; it is still waiting to be done.
 * - A missed session stays the thing to do until you train again. Once a later session is finished, the programme has
 *   moved on: the missed one is offered on a free day, never forced back to the front.
 * - Tomorrow's session is only ever previewed.
 */
export type DaySession = {
  id: string;
  scheduledOn: string;
  status: string;
  /** Local calendar date the session was started, if it was. */
  startedOn: string | null;
  /** Local calendar date the session was finished, if it was. */
  completedOn: string | null;
  loggedSets: number;
};

export type DayPlan<S extends DaySession = DaySession> =
  | { kind: "in_progress"; session: S }
  | { kind: "today"; session: S }
  | { kind: "catch_up"; session: S }
  | { kind: "done"; session: S; next: S | null }
  | { kind: "rest"; next: S | null; missed: S | null }
  | { kind: "none" };

const MISSED_WINDOW_DAYS = 6;

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86400000);
}

/** Opened and left without a single logged set: treat it as never started. */
export function isUntouched(s: DaySession, todayIso: string): boolean {
  return s.status === "in_progress" && s.loggedSets === 0 && (s.startedOn ?? s.scheduledOn) < todayIso;
}

export function planDay<S extends DaySession>(sessions: S[], todayIso: string): DayPlan<S> {
  const waiting = (s: S) => s.status === "planned" || isUntouched(s, todayIso);
  const byDate = [...sessions].sort((a, b) => a.scheduledOn.localeCompare(b.scheduledOn));

  // Partly logged and then left behind: once a later session is finished, it is history, not something to continue.
  const leftBehind = (s: S) => s.status === "in_progress" && (s.startedOn ?? s.scheduledOn) < todayIso && byDate.some((o) => o.id !== s.id && o.status === "completed" && (o.completedOn ?? o.scheduledOn) >= (s.startedOn ?? s.scheduledOn));
  const active = byDate.filter((s) => s.status === "in_progress" && !isUntouched(s, todayIso) && !leftBehind(s)).sort((a, b) => (b.startedOn ?? "").localeCompare(a.startedOn ?? ""))[0];
  if (active) return { kind: "in_progress", session: active };

  const next = byDate.find((s) => waiting(s) && s.scheduledOn > todayIso) ?? null;
  const doneToday = byDate.filter((s) => s.status === "completed" && (s.completedOn === todayIso || (s.completedOn == null && s.scheduledOn === todayIso))).pop();
  if (doneToday) return { kind: "done", session: doneToday, next };

  const planned = byDate.find((s) => waiting(s) && s.scheduledOn === todayIso);
  if (planned) return { kind: "today", session: planned };

  const missed = byDate.filter((s) => waiting(s) && s.scheduledOn < todayIso && daysBetween(s.scheduledOn, todayIso) <= MISSED_WINDOW_DAYS).pop() ?? null;
  if (missed) {
    const trainedSince = byDate.some((s) => s.status === "completed" && (s.completedOn ?? s.scheduledOn) >= missed.scheduledOn && s.id !== missed.id);
    if (!trainedSince) return { kind: "catch_up", session: missed };
    return { kind: "rest", next, missed };
  }
  if (next) return { kind: "rest", next, missed: null };
  return { kind: "none" };
}

/** "yesterday", "Monday" or "Mon 8 Sep" for a past date, from calendar dates only. */
export function pastDayLabel(dateIso: string, todayIso: string): string {
  const days = daysBetween(dateIso, todayIso);
  const d = new Date(`${dateIso}T12:00:00Z`);
  const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days > 1 && days < 7) return WEEKDAY[d.getUTCDay()]!;
  return `${WEEKDAY[d.getUTCDay()]!.slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

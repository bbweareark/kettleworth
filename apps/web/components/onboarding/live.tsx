"use client";
import type { BaselineMetrics, TrainingProfile } from "@kettleworth/types";
import { Figure, Readout } from "@kettleworth/ui";

type P = Partial<TrainingProfile>;

/**
 * The machine you are calibrating.
 *
 * The intake used to be a chat bubble above a form card, thirteen times, and the owner's
 * verdict was the right one: it read as a bot asking questions. The questions themselves are
 * not the problem - a programme genuinely needs this much about you - the problem was that
 * nothing visible happened when you answered one.
 *
 * So the answers now drive figures. The moment height, weight, age and sex are in, your
 * maintenance calories appear and count up; picking days and a timeline turns into the number
 * of sessions in the block; a logged set turns into an estimated max. Every number here is
 * computed from what you typed by the same functions the app uses afterwards, so none of it is
 * a progress-bar illusion - it is the plan, assembling itself while you watch.
 */
export function LiveFigures({ p, baseline }: { p: P; baseline: BaselineMetrics | null }) {
  const sessions = p.daysPerWeek && p.timelineWeeks ? p.daysPerWeek * p.timelineWeeks : null;

  /*
   * Epley, the same estimate the session player and Progress use, so the number a lifter sees
   * here is the number they will see on their first session.
   */
  const best = (p.knownLifts ?? []).reduce<number | null>((max, l) => {
    if (!l.weightKg || !l.reps) return max;
    const e1rm = l.weightKg * (1 + l.reps / 30);
    return max == null || e1rm > max ? e1rm : max;
  }, null);

  const metric = (p.units ?? "metric") === "metric";
  const u = metric ? "kg" : "lb";
  const show = (kg: number) => Math.round(metric ? kg : kg * 2.20462);

  // The headline is whichever figure is both available and furthest along the intake, so the
  // one number on screen keeps getting more meaningful rather than being decided up front.
  const hero =
    best != null
      ? { label: "Estimated max", value: show(best), unit: u, note: "Week one is calibrated from this." }
      : baseline?.targetCalories
        ? { label: "Your daily target", value: baseline.targetCalories, unit: "kcal", note: `${baseline.proteinG ?? 0} g protein, from your body and your goal.` }
        : baseline?.tdee
          ? { label: "What you burn in a day", value: baseline.tdee, unit: "kcal", note: "Before we know what you are training for." }
          : sessions
            ? { label: "Sessions in your block", value: sessions, note: `${p.daysPerWeek} a week for ${p.timelineWeeks} weeks.` }
            : null;

  if (!hero) {
    return (
      <div className="border-t border-rule pt-4">
        <p className="meta">Nothing calculated yet</p>
        <p className="measure mt-1 text-sm text-fg-muted">Answer the first few and the numbers start appearing here: what you burn, what to eat, how many sessions, where the bar starts.</p>
      </div>
    );
  }

  return (
    <div className="border-t border-rule pt-4">
      <Figure label={hero.label} value={hero.value} unit={hero.unit} note={hero.note} size="sm" />
      <div className="mt-5 grid grid-cols-3 gap-x-4">
        <Readout label="Maintenance" value={baseline?.tdee ?? "–"} unit={baseline?.tdee ? "kcal" : undefined} />
        <Readout label="Protein" value={baseline?.proteinG ?? "–"} unit={baseline?.proteinG ? "g" : undefined} />
        <Readout label="Sessions" value={sessions ?? "–"} />
      </div>
    </div>
  );
}

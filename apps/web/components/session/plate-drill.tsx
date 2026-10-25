"use client";
import { useEffect, useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import {
  makeRound, checkRound, totalFor,
  DRILL_MAX_SOLVES, DRILL_POINTS_PER_SOLVE,
  type DrillRound, type DrillVerdict,
} from "@kettleworth/core";
import { Button, cn } from "@kettleworth/ui";

/**
 * Plate Drill. The rest-period game.
 *
 * Load one side of the bar to hit the target. No round timer, no penalty for a wrong answer,
 * no streak you can lose: the only clock is the rest clock that was already running, and it
 * is always on screen so the game can never be the reason you are late for a set.
 *
 * Growth stops at six solves a session (DRILL_MAX_SOLVES). After that it keeps playing and
 * says plainly that it is no longer paying, so there is nothing to farm.
 */
export function PlateDrill({
  seedKey,
  units,
  solvedThisSession,
  onSolved,
  restLeft,
}: {
  seedKey: string;
  units: "metric" | "imperial";
  solvedThisSession: number;
  onSolved: (points: number) => void;
  restLeft: number | null;
}) {
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<DrillVerdict | null>(null);
  const [solved, setSolved] = useState(solvedThisSession);

  const round: DrillRound = useMemo(() => makeRound(seedKey, streak, units), [seedKey, streak, units]);
  const unit = units === "metric" ? "kg" : "lb";
  const current = totalFor(round.bar, picked);
  const capped = solved >= DRILL_MAX_SOLVES;

  // A new round clears the bar.
  useEffect(() => { setPicked([]); setVerdict(null); }, [round.id]);

  function submit() {
    const v = checkRound(round, picked, solved);
    setVerdict(v);
    if (!v.correct) return;
    if (v.points > 0) {
      setSolved((n) => n + 1);
      onSolved(v.points);
    }
    window.setTimeout(() => setStreak((s) => s + 1), 1100);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
        <span className="meta">Plate drill</span>
        <span className="meta">
          {capped ? "Session limit reached" : `${solved} / ${DRILL_MAX_SOLVES} · ${DRILL_POINTS_PER_SOLVE} growth each`}
        </span>
      </div>

      <div className="flex items-end justify-between gap-6 py-4">
        <div>
          <p className="meta">Load the bar to</p>
          <p className="font-display text-4xl tabular">{round.target} <span className="text-lg text-fg-subtle">{unit}</span></p>
        </div>
        <div className="text-right">
          <p className="meta">{round.bar} {unit} bar · one side</p>
          <p className={cn("font-display text-2xl tabular", current === round.target ? "text-signal" : "text-fg-muted")}>
            {current} <span className="text-sm text-fg-subtle">{unit}</span>
          </p>
        </div>
      </div>

      {/* what is on the bar */}
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 border-y border-rule py-2">
        {picked.length === 0 ? (
          <span className="text-sm text-fg-subtle">Bar is empty.</span>
        ) : (
          picked.map((p, i) => (
            <span key={`${p}-${i}`} className="border border-rule-strong px-2 py-1 text-sm tabular">{p}</span>
          ))
        )}
        {picked.length > 0 && (
          <button
            type="button"
            onClick={() => { setPicked((v) => v.slice(0, -1)); setVerdict(null); }}
            aria-label="Remove the last plate"
            className="ml-auto inline-flex h-8 items-center gap-1.5 px-2 text-xs text-fg-muted hover:text-fg"
          >
            <Undo2 className="size-3.5" strokeWidth={1.5} /> Undo
          </button>
        )}
      </div>

      {/* the rack */}
      <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {round.plates.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { setPicked((v) => [...v, p]); setVerdict(null); }}
            className="h-11 border border-rule text-sm tabular transition-colors hover:border-rule-strong hover:bg-fg hover:text-bg"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={submit} disabled={picked.length === 0}>Rack it</Button>
        {verdict && (
          <p className={cn("text-sm", verdict.correct ? "text-signal" : "text-fg-muted")} role="status">
            {verdict.message}
          </p>
        )}
      </div>

      {restLeft != null && restLeft <= 10 && (
        <p className="mt-3 border-t border-rule pt-2 text-sm text-ember" role="status">
          Rest is nearly up. Put the phone down.
        </p>
      )}
    </div>
  );
}

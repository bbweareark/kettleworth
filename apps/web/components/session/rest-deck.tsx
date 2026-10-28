"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Brain, Wind, Target, Lightbulb, Check, X, Zap } from "lucide-react";
import { pickRestContent, breathingPattern, type Quiz, type Fact } from "@kettleworth/core";
import { Button, cn } from "@kettleworth/ui";
import type { CheckCard } from "./form-check";
import { WordRush } from "./word-rush";

const QUIZ_SECONDS = 20;
type Props = { sessionId: string; seedKey: string; restSeconds: number; seen: string[]; onSeen: (id: string) => void; tips: CheckCard[]; nextSet: { repRange: [number, number] | null; reps: number | null } | null; units?: "metric" | "imperial"; onPrediction?: (reps: number) => void };

/**
 * Rest Deck: something worth doing while the clock runs. Content is real (the quiz is the evidence behind the user's plan),
 * timed to the rest, and every completed card is recorded so it counts toward Growth and never repeats.
 */
type Served = { quiz: Quiz | null; fact: Fact | null };
/** Solves are counted for the whole session so the drill cannot be farmed rest after rest. */
let scoringRuns = 0;
async function fetchNext(exclude: string[]): Promise<Served | null> {
  try { const r = await fetch(`/api/rest/next?exclude=${encodeURIComponent(exclude.slice(-120).join(","))}`, { cache: "no-store" }); if (!r.ok) return null; return (await r.json()) as Served; } catch { return null; }
}

export function RestDeck(p: Props) {
  const initial = useMemo(() => pickRestContent(p.seedKey, p.seen, p.restSeconds), [p.seedKey, p.seen, p.restSeconds]);
  const [mode, setMode] = useState<"quiz" | "fact" | "breathe" | "predict" | "tip" | "drill">(initial.kind);
  // Served content: fetched fresh for every rest (the pool refills itself); the built-in bank covers offline.
  const [served, setServed] = useState<Served | null>(null);
  const shown = useRef<string[]>([]);
  const load = async () => {
    const next = await fetchNext([...p.seen, ...shown.current]);
    const fallback: Served = { quiz: pickRestContent(p.seedKey + ":q:" + shown.current.length, [...p.seen, ...shown.current], 999).quiz ?? null, fact: pickRestContent(p.seedKey + ":f:" + shown.current.length, [...p.seen, ...shown.current], 10).fact ?? null };
    const s = next ?? fallback;
    if (s.quiz) shown.current.push(s.quiz.id);
    if (s.fact) shown.current.push(s.fact.id);
    setServed(s);
  };
  // One fresh card per rest, keyed by the rest itself.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [p.seedKey]);
  const modes = [["drill", Zap, "Rush"], ["quiz", Brain, "Quiz"], ["breathe", Wind, "Breathe"], ["predict", Target, "Call it"], ["tip", Lightbulb, "Tip"]] as const;
  // The deck sits below the clock and the controls, so on a phone the chosen card starts off
  // screen. Pull its foot to the viewport foot on every switch: clock stays up, card is in reach.
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const pick = (m: typeof mode) => {
    setMode(m);
    requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" }));
  };
  return (
    <div className="mt-5 border-t border-rule pt-4">
      {/* Five tabs as a pill group, the one navigation shape this system has. */}
      <div className="scrollbar-none mb-4 flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Rest deck">{modes.map(([m, I, l]) => <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => pick(m)} className={cn("inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors", mode === m ? "border-fg bg-fg text-bg" : "border-rule text-fg-muted hover:border-rule-strong hover:text-fg")}><I className="size-3.5" aria-hidden />{l}</button>)}</div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div ref={panel} key={mode} className="scroll-mb-24" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {mode === "drill" && (
            <WordRush
              seedKey={p.seedKey}
              scoringRunsThisSession={scoringRuns}
              restLeft={p.restSeconds}
              onScoringRun={(pts) => { scoringRuns += 1; void record({ sessionId: p.sessionId, kind: "drill", correct: true, detail: { points: pts, game: "word-rush" } }); }}
            />
          )}
          {mode === "quiz" && (served ? <QuizCard key={served.quiz?.id ?? "none"} quiz={served.quiz} sessionId={p.sessionId} onDone={p.onSeen} onNext={load} /> : <Loading label="Picking a question" />)}
          {mode === "breathe" && <BreatheCard restSeconds={p.restSeconds} sessionId={p.sessionId} />}
          {mode === "predict" && <PredictCard nextSet={p.nextSet} sessionId={p.sessionId} onPrediction={p.onPrediction} />}
          {mode === "tip" && <TipCard key={served?.fact?.id ?? "tip"} tips={p.tips} fact={served?.fact ?? undefined} onMoreFacts={load} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return <div className="space-y-2 py-1" aria-busy><div className="meta">{label}</div><div className="h-5 w-3/4 animate-pulse rounded-sm bg-rule-strong" /><div className="h-12 animate-pulse rounded-md bg-rule" /><div className="h-12 animate-pulse rounded-md bg-rule" /></div>;
}

async function record(body: Record<string, unknown>) { try { await fetch("/api/rest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); } catch {} }

function QuizCard({ quiz, sessionId, onDone, onNext }: { quiz: Quiz | null; sessionId: string; onDone: (id: string) => void; onNext: () => void }) {
  const [left, setLeft] = useState(QUIZ_SECONDS);
  const [picked, setPicked] = useState<number | null>(null);
  const done = useRef(false);
  useEffect(() => { if (!quiz || picked != null) return; const t = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(t); return 0; } return l - 1; }), 1000); return () => clearInterval(t); }, [quiz, picked]);
  useEffect(() => { if (left === 0 && picked == null && quiz && !done.current) { done.current = true; setPicked(-1); record({ sessionId, kind: "quiz", itemId: quiz.id, correct: false, detail: { timedOut: true } }); onDone(quiz.id); } }, [left, picked, quiz, sessionId, onDone]);
  if (!quiz) return <p className="text-sm text-fg-muted">No question this time. Try Breathe or Tip.</p>;
  const answer = (i: number) => { if (picked != null || done.current) return; done.current = true; setPicked(i); record({ sessionId, kind: "quiz", itemId: quiz.id, correct: i === quiz.answer, detail: { picked: i, secondsLeft: left } }); onDone(quiz.id); };
  const correct = picked === quiz.answer;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between border-b border-rule pb-2 meta"><span>Quiz · {quiz.tag}</span>{picked == null ? <span className={cn("tabular", left <= 5 && "text-volt")}>{left}s</span> : null}</div>
      <p className="font-display text-xl leading-snug">{quiz.q}</p>
      <div className="mt-4 grid gap-1.5">{quiz.options.map((o, i) => (
        <button key={i} type="button" disabled={picked != null} onClick={() => answer(i)} className={cn("rounded-md border px-4 py-3 text-left text-sm transition-colors", picked == null ? "border-rule hover:border-fg" : i === quiz.answer ? "border-fg bg-fg text-bg" : i === picked ? "border-volt text-volt" : "border-rule opacity-45")}>
          <span className="flex items-center gap-2">{picked != null && i === quiz.answer ? <Check className="size-4" /> : picked === i ? <X className="size-4" /> : null}{o}</span>
        </button>))}</div>
      {picked != null && <><p className="measure mt-3 text-sm text-fg-muted"><span className={cn("font-medium", correct ? "text-fg" : "text-volt")}>{picked === -1 ? "Time." : correct ? "Right, +10 Growth." : "Not quite."}</span> {quiz.why}</p><Button size="sm" variant="ghost" className="mt-2" onClick={onNext}>Next question</Button></>}
    </div>
  );
}

function BreatheCard({ restSeconds, sessionId }: { restSeconds: number; sessionId: string }) {
  const reduce = useReducedMotion();
  const pat = breathingPattern(restSeconds);
  const total = pat.inhale + pat.hold + pat.exhale;
  const [t, setT] = useState(0);
  const [cycles, setCycles] = useState(0);
  const logged = useRef(false);
  useEffect(() => { const i = setInterval(() => setT((x) => { const n = x + 1; if (n >= total) { setCycles((c) => c + 1); return 0; } return n; }), 1000); return () => clearInterval(i); }, [total]);
  useEffect(() => { if (cycles >= 2 && !logged.current) { logged.current = true; record({ sessionId, kind: "breathe", itemId: `breathe-${pat.inhale}-${pat.hold}-${pat.exhale}`, correct: null, detail: { cycles } }); } }, [cycles, pat, sessionId]);
  const phase = t < pat.inhale ? "Inhale" : t < pat.inhale + pat.hold ? "Hold" : "Exhale";
  const scale = phase === "Inhale" ? 1 + (t / pat.inhale) * 0.5 : phase === "Hold" ? 1.5 : 1.5 - ((t - pat.inhale - pat.hold) / pat.exhale) * 0.5;
  return (
    <div className="flex items-center gap-5">
      {/* A shape that breathes, not a glowing orb: the DNA allows no shadow and no blur. */}
      <div className="grid size-24 shrink-0 place-items-center rounded-lg border border-rule"><motion.div animate={reduce ? {} : { scale }} transition={{ duration: 1, ease: "linear" }} className="size-12 rounded-md bg-volt" /></div>
      <div><div className="meta">Breathe · {pat.inhale}-{pat.hold}-{pat.exhale} · cycle {cycles + 1} of {pat.cycles}</div><div className="font-display text-3xl">{phase}</div><p className="measure mt-1 text-sm text-fg-muted">Nose in, long exhale. Slower breathing brings heart rate down faster between sets, so the next set starts fresher.</p></div>
    </div>
  );
}

function PredictCard({ nextSet, sessionId, onPrediction }: { nextSet: Props["nextSet"]; sessionId: string; onPrediction?: (reps: number) => void }) {
  const [v, setV] = useState<number | null>(null);
  if (!nextSet) return <p className="text-sm text-fg-muted">No next set on this exercise. Move to the next one when the clock ends.</p>;
  const lo = nextSet.repRange?.[0] ?? Math.max(1, (nextSet.reps ?? 8) - 3), hi = nextSet.repRange?.[1] ?? (nextSet.reps ?? 8) + 3;
  const opts = Array.from({ length: hi - lo + 3 }, (_, i) => lo - 1 + i).filter((n) => n > 0);
  return (
    <div>
      <div className="meta">Call your next set</div>
      <p className="font-display text-xl">How many reps will you get?</p>
      <p className="measure text-sm text-fg-muted">Target {lo} to {hi}. Calling it honestly trains the skill that makes effort ratings useful. Within one rep earns Growth.</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{opts.map((n) => <button key={n} type="button" disabled={v != null} onClick={() => { setV(n); onPrediction?.(n); record({ sessionId, kind: "predict", itemId: `predict-${Date.now()}`, correct: null, detail: { predicted: n, lo, hi } }); }} className={cn("size-12 rounded-full border text-sm tabular transition-colors", v === n ? "border-volt bg-volt text-volt-fg" : "border-rule text-fg-muted hover:border-fg hover:text-fg")}>{n}</button>)}</div>
      {v != null && <p className="mt-2 text-sm">Locked in: {v}. Log the set and we&apos;ll compare.</p>}
    </div>
  );
}

function TipCard({ tips, fact, onMoreFacts }: { tips: CheckCard[]; fact?: Fact; onMoreFacts: () => void }) {
  const [i, setI] = useState(0);
  const items = [...(fact ? [{ kind: "fact", text: fact.text }] : []), ...tips];
  const c = items[i % Math.max(1, items.length)];
  if (!c) return null;
  return (<div><div className="meta">{c.kind === "fact" ? "Did you know" : c.kind === "cue" ? "Cue" : c.kind === "mistake" ? "Avoid" : "For you"}</div><p className="measure mt-1 font-display text-xl leading-snug">{c.text}</p><div className="mt-2 flex gap-2">{items.length > 1 && <Button size="sm" variant="ghost" onClick={() => setI((x) => x + 1)}>Next</Button>}{c.kind === "fact" && <Button size="sm" variant="ghost" onClick={onMoreFacts}>Another fact</Button>}</div></div>);
}

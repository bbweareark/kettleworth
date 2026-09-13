"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Brain, Wind, Target, Lightbulb, Check, X } from "lucide-react";
import { pickRestContent, breathingPattern, type Quiz, type Fact } from "@kettleworth/core";
import { Button, cn } from "@kettleworth/ui";
import type { CheckCard } from "./form-check";

const QUIZ_SECONDS = 20;
type Props = { sessionId: string; seedKey: string; restSeconds: number; seen: string[]; onSeen: (id: string) => void; tips: CheckCard[]; nextSet: { repRange: [number, number] | null; reps: number | null } | null; onPrediction?: (reps: number) => void };

/**
 * Rest Deck: something worth doing while the clock runs. Content is real (the quiz is the evidence behind the user's plan),
 * timed to the rest, and every completed card is recorded so it counts toward Growth and never repeats.
 */
export function RestDeck(p: Props) {
  const initial = useMemo(() => pickRestContent(p.seedKey, p.seen, p.restSeconds), [p.seedKey, p.seen, p.restSeconds]);
  const [mode, setMode] = useState<"quiz" | "fact" | "breathe" | "predict" | "tip">(initial.kind);
  const modes = [["quiz", Brain, "Quiz"], ["breathe", Wind, "Breathe"], ["predict", Target, "Call it"], ["tip", Lightbulb, "Tip"]] as const;
  return (
    <div className="mt-4 rounded-2xl bg-black/25 p-3">
      <div className="mb-2 flex gap-1" role="tablist" aria-label="Rest deck">{modes.map(([m, I, l]) => <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors", mode === m ? "bg-fg text-bg" : "text-fg-muted hover:bg-white/10 hover:text-fg")}><I className="size-3.5" />{l}</button>)}</div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {mode === "quiz" && <QuizCard quiz={initial.kind === "quiz" && initial.quiz ? initial.quiz : (pickRestContent(p.seedKey + ":q", p.seen, 999).quiz ?? null)} sessionId={p.sessionId} onDone={p.onSeen} />}
          {mode === "breathe" && <BreatheCard restSeconds={p.restSeconds} sessionId={p.sessionId} />}
          {mode === "predict" && <PredictCard nextSet={p.nextSet} sessionId={p.sessionId} onPrediction={p.onPrediction} />}
          {mode === "tip" && <TipCard tips={p.tips} fact={initial.kind === "fact" ? initial.fact : undefined} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

async function record(body: Record<string, unknown>) { try { await fetch("/api/rest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); } catch {} }

function QuizCard({ quiz, sessionId, onDone }: { quiz: Quiz | null; sessionId: string; onDone: (id: string) => void }) {
  const [left, setLeft] = useState(QUIZ_SECONDS);
  const [picked, setPicked] = useState<number | null>(null);
  const done = useRef(false);
  useEffect(() => { if (!quiz || picked != null) return; const t = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(t); return 0; } return l - 1; }), 1000); return () => clearInterval(t); }, [quiz, picked]);
  useEffect(() => { if (left === 0 && picked == null && quiz && !done.current) { done.current = true; setPicked(-1); record({ sessionId, kind: "quiz", itemId: quiz.id, correct: false, detail: { timedOut: true } }); onDone(quiz.id); } }, [left, picked, quiz, sessionId, onDone]);
  if (!quiz) return <p className="text-sm text-fg-muted">You've cleared the whole quiz bank. New questions arrive with each evidence update.</p>;
  const answer = (i: number) => { if (picked != null || done.current) return; done.current = true; setPicked(i); record({ sessionId, kind: "quiz", itemId: quiz.id, correct: i === quiz.answer, detail: { picked: i, secondsLeft: left } }); onDone(quiz.id); };
  const correct = picked === quiz.answer;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-2xs uppercase tracking-[0.14em] text-fg-subtle"><span>Coach quiz · {quiz.tag}</span>{picked == null ? <span className={cn("tabular", left <= 5 && "text-rose")}>{left}s</span> : null}</div>
      <p className="font-display text-lg font-semibold leading-snug tracking-tighter">{quiz.q}</p>
      <div className="mt-3 grid gap-1.5">{quiz.options.map((o, i) => (
        <button key={i} type="button" disabled={picked != null} onClick={() => answer(i)} className={cn("rounded-lg border px-3 py-2 text-left text-sm transition-colors", picked == null ? "border-border bg-surface/40 hover:border-border-strong" : i === quiz.answer ? "border-signal bg-signal-soft" : i === picked ? "border-rose bg-rose-soft" : "border-border opacity-50")}>
          <span className="flex items-center gap-2">{picked != null && i === quiz.answer ? <Check className="size-4 text-signal" /> : picked === i ? <X className="size-4 text-rose" /> : null}{o}</span>
        </button>))}</div>
      {picked != null && <p className="mt-3 text-sm text-fg-muted"><span className={cn("font-medium", correct ? "text-signal" : "text-amber")}>{picked === -1 ? "Time." : correct ? "Right, +10 Growth." : "Not quite."}</span> {quiz.why}</p>}
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
      <div className="grid size-24 shrink-0 place-items-center"><motion.div animate={reduce ? {} : { scale }} transition={{ duration: 1, ease: "linear" }} className="size-14 rounded-full bg-sky/70 shadow-[0_0_40px_var(--color-sky)]" /></div>
      <div><div className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">Breathe · {pat.inhale}-{pat.hold}-{pat.exhale} · cycle {cycles + 1} of {pat.cycles}</div><div className="font-display text-3xl font-semibold tracking-tighter">{phase}</div><p className="mt-1 text-sm text-fg-muted">Nose in, long exhale. Slower breathing brings heart rate down faster between sets, so the next set starts fresher.</p></div>
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
      <div className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">Call your next set</div>
      <p className="font-display text-lg font-semibold tracking-tighter">How many reps will you get?</p>
      <p className="text-sm text-fg-muted">Target {lo} to {hi}. Calling it honestly trains the skill that makes RPE useful. Within one rep earns Growth.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{opts.map((n) => <button key={n} type="button" disabled={v != null} onClick={() => { setV(n); onPrediction?.(n); record({ sessionId, kind: "predict", itemId: `predict-${Date.now()}`, correct: null, detail: { predicted: n, lo, hi } }); }} className={cn("size-10 rounded-full text-sm font-medium tabular", v === n ? "bg-ember text-ember-fg" : "bg-surface/50 hover:bg-white/10")}>{n}</button>)}</div>
      {v != null && <p className="mt-2 text-sm text-signal">Locked in: {v}. Log the set and we'll compare.</p>}
    </div>
  );
}

function TipCard({ tips, fact }: { tips: CheckCard[]; fact?: Fact }) {
  const [i, setI] = useState(0);
  const items = [...(fact ? [{ kind: "fact", text: fact.text }] : []), ...tips];
  const c = items[i % Math.max(1, items.length)];
  if (!c) return null;
  return (<div><div className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">{c.kind === "fact" ? "Did you know" : c.kind === "cue" ? "Cue" : c.kind === "mistake" ? "Avoid" : "For you"}</div><p className="mt-1 font-display text-lg font-semibold leading-snug tracking-tighter">{c.text}</p>{items.length > 1 && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setI((x) => x + 1)}>Next</Button>}</div>);
}

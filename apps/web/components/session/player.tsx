"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronRight, ChevronDown, ChevronUp, Info, Repeat, WifiOff, ShieldAlert, AlertOctagon, Minus, Plus, RotateCcw, History, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { LoggedSet, PlannedSet, ExerciseSummary } from "@kettleworth/types";
import { Badge, Button, Card, CardContent, Progress, Sheet, SheetContent, Segmented, Textarea, CoachPulse, Dialog, DialogContent, cn, toast, type PulseItem } from "@kettleworth/ui";
import { kgToLb, lbToKg, round, restFor, autoregulate, loadStep, loadModel, platesPerSide, describePlates, DEFAULT_BARS_KG, BAR_CHOICES_KG, BAR_CHOICES_LB, BAR_NAMES, type BarKind } from "@kettleworth/core";
import { ExerciseMedia } from "@/components/library/media";
import { RestTimer, ElapsedClock } from "./timer";
import { FormCheck, type CheckCard } from "./form-check";
import { RestDeck } from "./rest-deck";
import { PRCelebration } from "./celebrate";
import { LiftHistory, fmtKg, type LiftHistoryData } from "@/components/lifts/lift-history";
import { dayMonth } from "@/lib/format";
import { postResilient, flush, pending } from "@/lib/offline-queue";
import { MuscleFigure } from "@/components/muscle-figure";

type BarWeights = Partial<Record<BarKind, number>>;
type Exercise = { id: string; slug: string; name: string; primaryMuscles: string[]; equipment: string[]; imageUrls: string[]; cues: string[]; instructions: string[]; commonMistakes: string[]; pattern: string; mechanics?: "compound" | "isolation"; category?: string; unilateral?: boolean };
type Caution = { level: "info" | "warn" | "stop"; text: string };
type Benchmark = { last: { date: string; sets: { weightKg: number | null; reps: number | null; rpe: number | null }[] } | null; bestWeight: { weightKg: number; reps: number; date: string } | null; bestE1rm: { e1rm: number; weightKg: number; reps: number; date: string } | null; sessions: number };
type Instance = { benchmark?: Benchmark | null; id: string; exerciseId: string; order: number; role: string; plannedSets: PlannedSet[]; loggedSets: LoggedSet[]; rationale: string; notes: string | null; exercise: Exercise; lastTime: LoggedSet[] | null; swappedReason: string | null; cautions: Caution[]; video: { provider: string; playbackId: string | null; isPlaceholder: boolean; status: string } | null };
type Detail = { session: { id: string; name: string; status: string; scheduledOn: string; startedAt: string | null; warmup: string[]; estimatedMinutes: number; focus: string[]; readinessScore: number | null; intensityScalar: number }; week: { weekNumber: number; isDeload: boolean } | null; instances: Instance[]; seenRest?: string[] };

export function SessionPlayer({ detail, units, sex, barWeights: initialBars, todayIso, autoStart = false }: { detail: Detail; units: "metric" | "imperial"; sex?: "male" | "female" | "other" | null; barWeights?: BarWeights; todayIso: string; autoStart?: boolean }) {
  const [barWeights, setBarWeights] = useState<BarWeights>(initialBars ?? {});
  async function saveBar(kind: BarKind, kg: number) {
    const next = { ...barWeights, [kind]: kg }; setBarWeights(next);
    const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patch: { barWeights: next } }) }).catch(() => null);
    if (!r?.ok) toast.error("Couldn't save the bar weight"); else toast.success(`${BAR_NAMES[kind]} set to ${round(units === "metric" ? kg : kgToLb(kg), 1)} ${units === "metric" ? "kg" : "lb"}`);
  }
  const router = useRouter();
  const [session, setSession] = useState(detail.session);
  const [instances, setInstances] = useState(detail.instances);
  const [idx, setIdx] = useState(() => Math.max(0, detail.instances.findIndex((i) => i.loggedSets.filter((l) => l.completed).length < i.plannedSets.length)));
  const [rest, setRest] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [pr, setPr] = useState<{ name: string; headline: string; detail: string } | null>(null);
  const [queued, setQueued] = useState(0);
  const [starting, setStarting] = useState(false);
  const [live, setLive] = useState<PulseItem[]>([]);
  const [seenRest, setSeenRest] = useState<string[]>(detail.seenRest ?? []);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const cur = instances[idx];
  const totalSets = instances.reduce((a, i) => a + i.plannedSets.length, 0);
  const doneSets = instances.reduce((a, i) => a + i.loggedSets.filter((l) => l.completed).length, 0);

  useEffect(() => { pending().then(setQueued); const on = () => flush().then(() => pending().then(setQueued)); window.addEventListener("online", on); return () => window.removeEventListener("online", on); }, []);
  // Start is idempotent: a planned session gets its readiness snapshot, an in-progress one gets its rest clocks refreshed.
  // Only a session for today, or a missed one, starts on open. A future session is a preview until you choose to train it.
  const preview = session.status === "planned" && session.scheduledOn > todayIso;
  useEffect(() => { if (session.status === "in_progress" || (session.status === "planned" && (session.scheduledOn <= todayIso || autoStart))) start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setStarting(true);
    const r = await fetch(`/api/session/${session.id}/start`, { method: "POST" }).then((x) => x.json()).catch(() => null);
    if (r?.session) {
      setSession(r.session);
      if (r.instances) setInstances((prev) => prev.map((i) => { const u = r.instances.find((x: { id: string }) => x.id === i.id); return u ? { ...i, plannedSets: u.plannedSets, notes: u.notes } : i; }));
      if (r.applied && r.readiness?.intensityScalar < 1) toast.message(`Loads eased ${Math.round((1 - r.readiness.intensityScalar) * 100)}% for today's readiness.`, { description: r.readiness.reasons?.[0] });
    }
    setStarting(false);
  }

  const logSet = useCallback(async (inst: Instance, set: PlannedSet, values: { weightKg: number | null; reps: number | null; rpe: number | null; barKg?: number | null }, confirmed = false): Promise<{ ok: true } | { ok: false; reason: string }> => {
    if (session.status === "planned") await start();
    const logged: LoggedSet = { setNumber: set.setNumber, reps: values.reps, weightKg: values.weightKg, rpe: values.rpe, durationSeconds: null, completed: true, loggedAt: new Date().toISOString(), ...(values.barKg != null ? { barKg: values.barKg } : {}), ...(confirmed ? { confirmed: true } : {}) };
    const r = await postResilient<{ pr: { headline: string; detail: string; value: number } | null }>(`/api/instance/${inst.id}/log`, logged);
    if (!r.ok && "needsConfirmation" in r) return { ok: false, reason: r.reason };
    setInstances((prev) => prev.map((i) => (i.id === inst.id ? { ...i, loggedSets: [...i.loggedSets.filter((l) => l.setNumber !== set.setNumber), logged].sort((a, b) => a.setNumber - b.setNumber) } : i)));
    if (!r.ok) { setQueued((q) => q + 1); toast.message("Saved on this device", { description: "We'll sync when you're back online.", icon: <WifiOff className="size-4" /> }); }
    else if (r.data.pr) setPr({ name: inst.exercise.name, headline: r.data.pr.headline, detail: r.data.pr.detail });
    // Coach reads the set back: on target, above, or below, from the actual numbers.
    const target = set.repRange ?? (set.reps != null ? [set.reps, set.reps] : null);
    const rpeGap = values.rpe != null && set.targetRpe != null ? values.rpe - set.targetRpe : null;
    let read = `Set ${set.setNumber} logged.`;
    if (target && values.reps != null) read = values.reps > target[1] ? `${values.reps} reps beats the ${target[0]} to ${target[1]} target. Add load next set if RPE allows.` : values.reps < target[0] ? `${values.reps} reps is under the ${target[0]} to ${target[1]} range. Drop 5 to 7% for the next set.` : `${values.reps} reps, inside the ${target[0]} to ${target[1]} range.${rpeGap != null ? (rpeGap <= -1 ? " RPE says you had more: nudge the load up." : rpeGap >= 1.5 ? " RPE ran hot: hold or ease the load." : " Effort on target.") : ""}`;
    if (confirmed) read += " Logged as unusual: it will not count as a record until you repeat it.";
    if (prediction != null && values.reps != null) { const hit = Math.abs(prediction - values.reps) <= 1; read += hit ? ` You called ${prediction} and got ${values.reps}: good self-knowledge, +10 Growth.` : ` You called ${prediction}, got ${values.reps}. Calibration improves with every honest set.`; fetch("/api/rest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, kind: "predict", itemId: `predict-hit-${inst.id}-${set.setNumber}`, correct: hit, detail: { predicted: prediction, actual: values.reps } }) }).catch(() => {}); setPrediction(null); }
    // Watch the set that was just lifted and move the weight for the sets that remain, with the reason and a way to keep the old weight.
    if (set.type === "working" && values.weightKg != null) {
      const lm = loadModel({ name: inst.exercise.name, equipment: inst.exercise.equipment as never, unilateral: !!inst.exercise.unilateral });
      const step = loadStep(lm.kind, units, lm.kind === "handheld" ? lm.implement : undefined);
      const doneNumbers = new Set([...inst.loggedSets.filter((l) => l.completed).map((l) => l.setNumber), set.setNumber]);
      const remaining = inst.plannedSets.filter((ps) => ps.type === "working" && ps.setNumber > set.setNumber && !doneNumbers.has(ps.setNumber));
      const adj = autoregulate({ weightKg: values.weightKg, reps: values.reps, rpe: values.rpe }, { repRange: set.repRange, reps: set.reps, targetRpe: set.targetRpe, weightKg: set.weightKg }, { step, units });
      if (adj.action !== "hold" && adj.nextWeightKg != null && remaining.length) {
        const before = remaining[0]!.weightKg ?? values.weightKg;
        const apply = (kg: number) => setInstances((prev) => prev.map((i) => (i.id === inst.id ? { ...i, plannedSets: i.plannedSets.map((ps) => (remaining.some((r) => r.setNumber === ps.setNumber) ? { ...ps, weightKg: kg } : ps)) } : i)));
        apply(adj.nextWeightKg);
        fetch(`/api/instance/${inst.id}/adjust`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ afterSetNumber: set.setNumber, weightKg: adj.nextWeightKg, reason: adj.reason }) }).catch(() => {});
        const shown = `${round(units === "metric" ? before : kgToLb(before), 1)} ${units === "metric" ? "kg" : "lb"}`;
        toast.message(adj.action === "up" ? "Heavier next set" : "Lighter next set", { description: adj.reason, duration: 9000, action: { label: `Keep ${shown}`, onClick: () => { apply(before); fetch(`/api/instance/${inst.id}/adjust`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ afterSetNumber: set.setNumber, weightKg: before, reason: "Kept the planned weight" }) }).catch(() => {}); } } });
        read = adj.reason.charAt(0).toUpperCase() + adj.reason.slice(1);
      }
    }
    setLive([{ text: read, tone: target && values.reps != null && values.reps < target[0] ? "amber" : "signal" }]);
    const isLast = set.setNumber === inst.plannedSets[inst.plannedSets.length - 1]!.setNumber;
    if (!isLast) setRest(set.restSeconds);
    else if (idx < instances.length - 1) { setRest(Math.min(set.restSeconds, 90)); }
    return { ok: true };
  }, [idx, instances.length, units, prediction, session.id, session.status]);

  async function resetExercise() {
    const r = await fetch(`/api/instance/${cur!.id}/reset`, { method: "POST" });
    if (!r.ok) return toast.error("Couldn't reset");
    setInstances((prev) => prev.map((i) => (i.id === cur!.id ? { ...i, loggedSets: [] } : i))); setRest(null); setLive([{ text: `${cur!.exercise.name} cleared. Start it again from set 1.`, tone: "ember" }]);
  }
  async function resetSessionAll() {
    const r = await fetch(`/api/session/${session.id}/reset`, { method: "POST" });
    if (!r.ok) return toast.error("Couldn't restart");
    const s2 = await r.json();
    setInstances((prev) => prev.map((i) => ({ ...i, loggedSets: [] }))); setIdx(0); setRest(null); setResetOpen(false); setSession((x) => ({ ...x, startedAt: s2.startedAt ?? new Date().toISOString() })); setLive([{ text: "Session restarted. Every set is back to the plan.", tone: "ember" }]);
  }

  async function doSwap(to: ExerciseSummary, permanent: boolean) {
    const r = await fetch(`/api/instance/${cur!.id}/swap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toExerciseId: to.id, reason: "user swap", permanent }) });
    if (!r.ok) return toast.error("Couldn't swap");
    const ex = await r.json();
    setInstances((prev) => prev.map((i) => (i.id === cur!.id ? { ...i, exerciseId: ex.id, exercise: ex, plannedSets: i.plannedSets.map((s) => ({ ...s, weightKg: null })), loggedSets: [], swappedReason: "user swap" } : i)));
    setSwapOpen(false);
    toast.success(`Swapped to ${ex.name}${permanent ? " for the rest of the programme" : ""}`);
  }

  if (!cur) return <div className="p-6 text-fg-muted">This session has no exercises.</div>;
  const restWhy = cur.exercise.mechanics ? restFor({ mechanics: cur.exercise.mechanics, pattern: cur.exercise.pattern, category: cur.exercise.category, equipment: cur.exercise.equipment, primaryMuscles: cur.exercise.primaryMuscles, unilateral: cur.exercise.unilateral }, { role: cur.role as never, goal: "muscle", topReps: cur.plannedSets.find((p) => p.type === "working")?.repRange?.[1] ?? 10, experience: "intermediate" }).reason : undefined;
  const curDone = cur.loggedSets.filter((l) => l.completed).length >= cur.plannedSets.length;
  const cards: CheckCard[] = [
    ...cur.cautions.filter((c) => c.level !== "info").map((c) => ({ kind: "foryou" as const, text: c.text })),
    ...(cur.exercise.cues.length ? cur.exercise.cues : cur.exercise.instructions).slice(0, 2).map((t) => ({ kind: "cue" as const, text: t })),
    ...cur.exercise.commonMistakes.slice(0, 1).map((t) => ({ kind: "mistake" as const, text: t })),
    ...cur.cautions.filter((c) => c.level === "info").slice(0, 1).map((c) => ({ kind: "safety" as const, text: c.text })),
  ];
  const restCards: CheckCard[] = [...cur.exercise.cues.map((t) => ({ kind: "cue" as const, text: t })), ...cur.exercise.commonMistakes.map((t) => ({ kind: "mistake" as const, text: t })), ...cur.cautions.map((c) => ({ kind: c.level === "info" ? ("safety" as const) : ("foryou" as const), text: c.text }))];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PRCelebration pr={pr} onClose={() => setPr(null)} />
      <div className="flex items-center justify-between gap-3">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Today</Link>
        <div className="flex items-center gap-3 text-xs">{queued > 0 && <Badge tone="amber"><WifiOff className="size-3" /> {queued} queued</Badge>}<ElapsedClock since={session.startedAt} /><button type="button" onClick={() => setResetOpen(true)} className="inline-flex items-center gap-1 text-fg-subtle hover:text-fg" aria-label="Restart session"><RotateCcw className="size-3.5" /> Restart</button></div>
      </div>
      {preview && !autoStart ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-soft px-4 py-3 ring-1 ring-sky/25">
          <p className="text-sm"><span className="font-medium">Previewing the session for {whenLabelClient(session.scheduledOn, todayIso)}.</span> <span className="text-fg-muted">Nothing starts until you log a set.</span></p>
          <Button size="sm" variant="secondary" loading={starting} onClick={() => start()}>Train it today</Button>
        </div>
      ) : null}
      <div><div className="flex items-center gap-2 text-xs text-fg-subtle"><span>{session.name}</span>{detail.week && <span>· Week {detail.week.weekNumber}</span>}{session.readinessScore != null && <Badge tone={session.intensityScalar < 1 ? "amber" : "signal"}>Readiness {session.readinessScore}</Badge>}</div><Progress value={(doneSets / Math.max(1, totalSets)) * 100} className="mt-2" label="Session progress" /></div>
      <CoachPulse label="Live" items={live.length ? live : [{ text: session.intensityScalar < 1 ? `Loads eased ${Math.round((1 - session.intensityScalar) * 100)}% for today's readiness. ${doneSets}/${totalSets} sets.` : `Watching every set. ${doneSets}/${totalSets} done.`, tone: "ember" }]} />

      {idx === 0 && doneSets === 0 && session.warmup.length ? (
        <Card><CardContent className="p-4"><div className="eyebrow mb-2">Warm-up · 8 min</div><ul className="space-y-1 text-sm text-fg-muted">{session.warmup.map((w) => <li key={w} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{w}</li>)}</ul></CardContent></Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="grid sm:grid-cols-[160px_1fr]">
          <div className="flex gap-3 p-4 pb-0 sm:flex-col sm:pb-4 sm:pr-0"><ExerciseMedia name={cur.exercise.name} images={cur.exercise.imageUrls} video={cur.video} compact className="aspect-[4/3] min-w-0 flex-1 sm:aspect-square sm:flex-none" /><MuscleFigure muscles={cur.exercise.primaryMuscles} sex={sex} size="md" /></div>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2"><Badge tone={cur.role === "primary" ? "ember" : "neutral"} className="capitalize">{cur.role}</Badge><span className="text-xs text-fg-subtle">Exercise {idx + 1} of {instances.length}</span>{cur.swappedReason && <Badge tone="amber">Swapped</Badge>}</div>
            <h1 className="font-display text-3xl font-semibold tracking-tightest">{cur.exercise.name}</h1>
            <PrescriptionNumerals sets={cur.plannedSets} />
            {cur.notes ? <p className="text-xs text-amber">{cur.notes}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1"><Button size="sm" variant="secondary" onClick={() => setShowInfo((s) => !s)} aria-expanded={showInfo}><Info /> How to {showInfo ? <ChevronUp /> : <ChevronDown />}</Button><Button size="sm" variant="secondary" onClick={() => setSwapOpen(true)}><Repeat /> Swap</Button></div>
          </CardContent>
        </div>
        {showInfo && (<div className="border-t border-border bg-surface-2 p-4 text-sm"><div className="grid gap-4 sm:grid-cols-2"><div><div className="eyebrow mb-1">Cues</div><ul className="space-y-1 text-fg-muted">{(cur.exercise.cues.length ? cur.exercise.cues : cur.exercise.instructions.slice(0, 4)).map((c) => <li key={c}>{c}</li>)}</ul></div><div><div className="eyebrow mb-1">Watch for</div><ul className="space-y-1 text-fg-muted">{cur.exercise.commonMistakes.length ? cur.exercise.commonMistakes.map((c) => <li key={c}>{c}</li>) : <li>Control the eccentric; stop 1 to 2 reps shy of failure unless told otherwise.</li>}</ul>{cur.cautions.filter((c) => c.level === "info").length ? <><div className="eyebrow mb-1 mt-3">Safety</div><ul className="space-y-1 text-fg-muted">{cur.cautions.filter((c) => c.level === "info").map((c, k) => <li key={k}>{c.text}</li>)}</ul></> : null}<p className="mt-2 text-xs text-fg-subtle">{cur.rationale}</p><Link href={`/library/${cur.exercise.slug}`} className="mt-2 inline-block text-ember hover:underline">Full exercise page</Link></div></div></div>)}
      </Card>

      {!curDone && <FormCheck key={`check-${cur.id}`} exerciseId={cur.exerciseId} name={cur.exercise.name} cards={cards} image={cur.exercise.imageUrls[0]} />}

      {rest != null ? <RestTimer key={rest + "-" + doneSets} seconds={rest} why={restWhy} onDone={() => setRest(null)} onSkip={() => setRest(null)}><RestDeck sessionId={session.id} seedKey={`${session.id}:${cur.id}:${doneSets}`} restSeconds={rest} seen={seenRest} onSeen={(id) => setSeenRest((s) => [...s, id])} tips={restCards} nextSet={(() => { const n = cur.plannedSets.find((ps) => !cur.loggedSets.some((l) => l.setNumber === ps.setNumber && l.completed)); return n ? { repRange: n.repRange, reps: n.reps } : null; })()} onPrediction={setPrediction} /></RestTimer> : null}

      <SetConsole key={`console-${cur.id}`} inst={cur} units={units} barWeights={barWeights} onBarChange={saveBar} onLog={(set, v, confirmed) => logSet(cur, set, v, confirmed)} onReset={resetExercise} />

      <div className="flex items-center justify-between gap-3 pb-6">
        <Button variant="ghost" disabled={idx === 0} onClick={() => { setIdx((i) => i - 1); setRest(null); }}><ArrowLeft /> Previous</Button>
        {idx < instances.length - 1 ? <Button variant={curDone ? "primary" : "secondary"} onClick={() => { setIdx((i) => i + 1); setRest(null); setShowInfo(false); }}>Next exercise <ArrowRight /></Button> : <Button onClick={() => setFinishOpen(true)} loading={starting}>Finish session <Check /></Button>}
      </div>

      <div className="flex flex-wrap gap-1">{instances.map((i, k) => (<button key={i.id} type="button" onClick={() => { setIdx(k); setRest(null); }} aria-label={`${i.exercise.name}${k === idx ? " (current)" : ""}`} aria-current={k === idx} className={cn("h-2 flex-1 rounded-full transition-colors", i.loggedSets.filter((l) => l.completed).length >= i.plannedSets.length ? "bg-signal" : k === idx ? "bg-ember" : "bg-surface-3")} />))}</div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogContent title="Restart this session?" description="Every logged set is cleared and the plan stays as prescribed for today. Records set in this session are removed."><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setResetOpen(false)}>Keep going</Button><Button variant="danger" onClick={resetSessionAll}><RotateCcw /> Restart</Button></div></DialogContent></Dialog>
      <Sheet open={swapOpen} onOpenChange={setSwapOpen}><SheetContent title="Swap exercise" description="Like-for-like alternatives that fit your equipment and injuries."><SwapList instanceId={cur.id} onPick={doSwap} /></SheetContent></Sheet>
      <Sheet open={finishOpen} onOpenChange={setFinishOpen}><SheetContent title="How did that go?" description="Thirty seconds of feedback shapes next week."><FinishForm sessionId={session.id} units={units} onDone={() => { router.push("/app"); router.refresh(); }} /></SheetContent></Sheet>
    </div>
  );
}

function PrescriptionNumerals({ sets }: { sets: PlannedSet[] }) {
  const w = sets.filter((s) => s.type === "working"); const f = w[0];
  if (!f) return null;
  const cells: [string, string][] = [[String(w.length), "sets"], [f.repRange ? `${f.repRange[0]}-${f.repRange[1]}` : String(f.reps ?? ""), "reps"]];
  if (f.targetRpe) cells.push([String(f.targetRpe), "rpe"]);
  cells.push([`${Math.round(f.restSeconds / 60 * 10) / 10}`, "min rest"]);
  if (f.tempo) cells.push([f.tempo, "tempo"]);
  return <div className="flex flex-wrap gap-x-5 gap-y-1">{cells.map(([v, l]) => <div key={l}><span className="font-display text-2xl font-semibold tabular tracking-tighter">{v}</span><span className="ml-1 text-2xs uppercase tracking-[0.16em] text-fg-subtle">{l}</span></div>)}</div>;
}
function describePrescription(sets: PlannedSet[]): string {
  const w = sets.filter((s) => s.type === "working");
  if (!w.length) return `${sets.length} sets`;
  const f = w[0]!;
  const reps = f.repRange ? `${f.repRange[0]} to ${f.repRange[1]}` : f.reps ?? "";
  return `${w.length} × ${reps}${f.targetRpe ? ` @ RPE ${f.targetRpe}` : ""}${f.targetRir != null ? ` (${f.targetRir} in reserve)` : ""} · ${Math.round(f.restSeconds / 60 * 10) / 10} min rest${f.tempo ? ` · tempo ${f.tempo}` : ""}`;
}
const fmtW = (kg: number | null, units: "metric" | "imperial") => (kg == null ? "-" : units === "metric" ? `${round(kg, 1)}` : `${round(kgToLb(kg), 1)}`);

const RPE_WORDS: Record<number, string> = { 6: "4 left", 7: "3 left", 8: "2 left", 9: "1 left", 10: "0 left" };

/**
 * The set console. One set is in focus at a time with big tactile numerals: weight and reps step by real plate increments,
 * effort is a five-stop scale in reps-in-reserve language, and the target and last time sit beside the numbers so the
 * lifter never has to remember them. Unusual values are challenged before they count.
 */
function SetConsole({ inst, units, barWeights, onBarChange, onLog, onReset }: { inst: Instance; units: "metric" | "imperial"; barWeights: BarWeights; onBarChange: (kind: BarKind, kg: number) => void; onLog: (set: PlannedSet, v: { weightKg: number | null; reps: number | null; rpe: number | null; barKg?: number | null }, confirmed?: boolean) => Promise<{ ok: true } | { ok: false; reason: string }>; onReset: () => void }) {
  const reduce = useReducedMotion();
  const sets = inst.plannedSets;
  const doneOf = (n: number) => inst.loggedSets.find((l) => l.setNumber === n && l.completed) ?? null;
  const firstOpen = sets.find((s) => !doneOf(s.setNumber))?.setNumber ?? sets[sets.length - 1]!.setNumber;
  const [focus, setFocus] = useState<number>(firstOpen);
  const prevDone = useRef(inst.loggedSets.filter((l) => l.completed).length);
  useEffect(() => { const n = inst.loggedSets.filter((l) => l.completed).length; if (n !== prevDone.current) { prevDone.current = n; setFocus(sets.find((s) => !doneOf(s.setNumber))?.setNumber ?? sets[sets.length - 1]!.setNumber); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [inst.loggedSets]);
  const set = sets.find((s) => s.setNumber === focus) ?? sets[0]!;
  const logged = doneOf(set.setNumber);
  const last = inst.lastTime?.find((l) => l.setNumber === set.setNumber && l.completed) ?? inst.lastTime?.filter((l) => l.completed).at(-1) ?? null;
  const model = loadModel({ name: inst.exercise.name, equipment: inst.exercise.equipment as never, unilateral: !!inst.exercise.unilateral });
  const metric = units === "metric";
  const toDisp = (kg: number) => round(metric ? kg : kgToLb(kg), 2);
  const disp = (kg: number | null | undefined) => (kg == null ? "" : String(round(metric ? kg : kgToLb(kg), 1)));
  const barKg = model.kind === "bar" ? (barWeights[model.bar] ?? DEFAULT_BARS_KG[units][model.bar]) : 0;
  const barDisp = model.kind === "bar" ? round(toDisp(barKg), 1) : 0;
  // Bars can be entered as the total or per side; the choice is remembered on this device.
  const [entry, setEntry] = useState<"total" | "side">("total");
  useEffect(() => { try { if (model.kind === "bar" && localStorage.getItem("kw-bar-entry") === "side") setEntry("side"); } catch {} /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const sideMode = model.kind === "bar" && entry === "side";
  const toField = (totalKg: number | null | undefined) => (totalKg == null ? "" : sideMode ? String(Math.max(0, round((toDisp(totalKg) - barDisp) / 2, 2))) : disp(totalKg));
  const step = model.kind === "bar" ? (sideMode ? (metric ? 1.25 : 2.5) : (metric ? 2.5 : 5))
    : model.kind === "handheld" ? (model.implement === "kettlebell" ? (metric ? 4 : 5) : (metric ? 2.5 : 5))
    : model.kind === "stack" ? (metric ? 5 : 10) : (metric ? 2.5 : 5);
  const [w, setW] = useState(() => toField(logged?.weightKg ?? set.weightKg));
  const [barOpen, setBarOpen] = useState(false);
  const fieldToTotalDisp = (v: string) => (v === "" ? null : sideMode ? Number(v) * 2 + barDisp : Number(v));
  function switchEntry(next: "total" | "side") {
    if (next === entry) return;
    const totalDisp = fieldToTotalDisp(w);
    setEntry(next);
    try { localStorage.setItem("kw-bar-entry", next); } catch {}
    if (totalDisp == null) return;
    setW(next === "side" ? String(Math.max(0, round((totalDisp - barDisp) / 2, 2))) : String(round(totalDisp, 2)));
  }
  const [r, setR] = useState(logged?.reps != null ? String(logged.reps) : set.reps != null ? String(set.reps) : set.repRange ? String(set.repRange[1]) : "");
  const [rpe, setRpe] = useState<number | null>(logged?.rpe ?? set.targetRpe ?? null);
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  useEffect(() => { const l = doneOf(set.setNumber); setW(toField(l?.weightKg ?? set.weightKg)); setR(l?.reps != null ? String(l.reps) : set.reps != null ? String(set.reps) : set.repRange ? String(set.repRange[1]) : ""); setRpe(l?.rpe ?? set.targetRpe ?? null); setChallenge(null); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [set.setNumber]);
  const nudge = (which: "w" | "r", d: number) => { if (which === "w") setW((x) => String(Math.max(0, round((Number(x) || 0) + d * step, 2)))); else setR((x) => String(Math.max(0, (Number(x) || 0) + d))); };
  const values = () => { const t = fieldToTotalDisp(w); return { weightKg: t == null ? null : metric ? t : lbToKg(t), reps: r === "" ? null : Number(r), rpe, barKg: model.kind === "bar" ? barKg : null }; };
  const submit = async (confirmed = false) => { setBusy(true); const res = await onLog(set, values(), confirmed); setBusy(false); if (!res.ok) setChallenge(res.reason); else setChallenge(null); };
  const target = set.repRange ? `${set.repRange[0]} to ${set.repRange[1]}` : set.reps != null ? String(set.reps) : "";
  const unit = metric ? "kg" : "lb";
  const done = !!logged;
  const totalNow = fieldToTotalDisp(w);
  const makeup = (() => {
    if (model.kind === "bar") {
      if (totalNow == null) return `${barDisp} ${unit} ${BAR_NAMES[model.bar].toLowerCase()}`;
      if (totalNow < barDisp) return `Less than the ${barDisp} ${unit} bar`;
      const pl = platesPerSide(totalNow, barDisp, units);
      const plates = pl.plates.length ? `${describePlates(pl.plates)} a side` : "empty bar";
      return sideMode ? `${round(totalNow, 1)} ${unit} total · ${plates}` : pl.exact ? plates : `${plates} (closest you can load is ${round(pl.loadable, 1)} ${unit})`;
    }
    if (model.kind === "handheld" && model.count === 2 && totalNow) return `A pair of ${round(totalNow, 1)} ${unit} ${model.implement}s`;
    return null;
  })();
  const planHint = set.weightKg != null ? `plan ${disp(set.weightKg)} ${unit}${model.kind === "handheld" ? ` ${model.hint}` : ""}` : model.hint;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(180deg,color-mix(in_oklch,var(--color-surface)_92%,var(--color-ember)),var(--color-surface))] p-3 ring-1 ring-white/[0.06] min-[360px]:p-4 sm:p-5" aria-label="Log sets">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-ember/10 blur-3xl" />
      <Benchmark inst={inst} units={units} onUse={(weightKg, reps, rpeVal) => { setW(toField(weightKg)); setR(reps != null ? String(reps) : ""); if (rpeVal != null) setRpe(rpeVal); }} />
      {/* Set track */}
      <ol className="flex items-center gap-1.5" aria-label="Sets">
        {sets.map((s) => { const l = doneOf(s.setNumber); const cur = s.setNumber === focus; return (
          <li key={s.setNumber} className="flex-1">
            <button type="button" onClick={() => setFocus(s.setNumber)} aria-current={cur ? "step" : undefined} className={cn("flex h-11 w-full flex-col items-center justify-center rounded-xl text-2xs uppercase tracking-[0.12em] transition-all", l ? "bg-signal-soft text-signal ring-1 ring-signal/30" : cur ? "bg-ember text-ember-fg shadow-glow" : "bg-black/25 text-fg-subtle ring-1 ring-white/[0.06]")}>
              <span>{s.type === "warmup" ? "warm" : `set ${s.setNumber}`}</span>
              {l ? <span className="font-display text-sm normal-case tracking-tight tabular">{disp(l.weightKg) || "bw"}×{l.reps ?? "-"}</span> : null}
            </button>
          </li>); })}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={set.setNumber} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.22 }} className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">{set.type === "warmup" ? "Warm-up" : `Set ${set.setNumber} of ${sets.length}`}{target ? <span className="text-ember"> · target {target}{set.targetRpe ? ` @ ${set.targetRpe}` : ""}</span> : null}</div>
          </div>

          {/* Phones: one full-width dial per value, so a four-digit weight never clips. Wider screens: side by side. */}
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {([["w", model.label, w, sideMode ? `${unit} a side` : unit, planHint], ["r", "Reps", r, "reps", target ? `aim ${target}` : ""]] as const).map(([k, label, val, u, hint]) => (
              <div key={k} className="rounded-2xl bg-black/30 px-2.5 py-2.5 ring-1 ring-white/[0.06] sm:px-3 sm:py-3">
                <div className="flex min-h-7 items-center justify-between gap-2 px-1">
                  <span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">{label}</span>
                  {k === "w" && model.kind === "bar" ? (
                    <span role="radiogroup" aria-label="Total or per side" className="inline-flex rounded-full bg-white/[0.05] p-0.5 ring-1 ring-white/[0.06]">
                      {(["total", "side"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={entry === m} onClick={() => switchEntry(m)} className={cn("h-6 rounded-full px-2.5 text-2xs font-medium transition-colors", entry === m ? "bg-fg text-bg" : "text-fg-muted")}>{m === "total" ? "Total" : "Per side"}</button>)}
                    </span>
                  ) : <span className="truncate text-2xs text-fg-subtle">{hint}</span>}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 min-[360px]:gap-2">
                  <button type="button" onClick={() => nudge(k, -1)} className="grid size-11 shrink-0 touch-manipulation place-items-center rounded-xl bg-white/[0.06] text-fg-muted transition-transform hover:bg-white/10 active:scale-90 min-[360px]:size-12" aria-label={k === "w" ? "Lighter" : "Fewer"}><Minus className="size-5" /></button>
                  <label className="flex min-w-0 flex-1 cursor-text items-baseline justify-center gap-1.5 rounded-xl py-1 focus-within:bg-white/[0.04]">
                    <input aria-label={k === "w" ? model.label : "Reps"} inputMode={k === "w" ? "decimal" : "numeric"} enterKeyHint="done" value={val} onChange={(e) => (k === "w" ? setW : setR)(e.target.value.replace(/[^0-9.]/g, "").slice(0, 6))} placeholder="0" style={{ width: `${Math.max(1, (val || "0").length) + 0.4}ch` }} className="min-w-0 bg-transparent text-right font-display text-[clamp(1.875rem,10vw,2.5rem)] font-semibold leading-none tabular tracking-tight text-fg caret-ember placeholder:text-fg-subtle/50 focus:outline-none" />
                    <span className="shrink-0 whitespace-nowrap text-sm text-fg-subtle">{u}</span>
                  </label>
                  <button type="button" onClick={() => nudge(k, 1)} className="grid size-11 shrink-0 touch-manipulation place-items-center rounded-xl bg-white/[0.06] text-fg-muted transition-transform hover:bg-white/10 active:scale-90 min-[360px]:size-12" aria-label={k === "w" ? "Heavier" : "More"}><Plus className="size-5" /></button>
                </div>
                {k === "w" && (model.kind === "bar" || makeup) ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs">
                    {model.kind === "bar" ? <button type="button" onClick={() => setBarOpen((o) => !o)} aria-expanded={barOpen} className="inline-flex h-6 items-center gap-1 rounded-full bg-white/[0.06] px-2 text-2xs text-fg-muted ring-1 ring-white/[0.06] hover:text-fg">{BAR_NAMES[model.bar]} {barDisp} {unit}<ChevronDown className={cn("size-3 transition-transform", barOpen && "rotate-180")} /></button> : null}
                    {makeup ? <span className="min-w-0 text-fg-subtle">{makeup}</span> : null}
                  </div>
                ) : null}
                {k === "w" && model.kind === "bar" && barOpen ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 px-1" role="radiogroup" aria-label={`${BAR_NAMES[model.bar]} weight`}>
                    {(metric ? BAR_CHOICES_KG : BAR_CHOICES_LB)[model.bar].map((c) => { const kg = metric ? c : round(lbToKg(c), 2); const on = Math.abs(barDisp - c) < 0.2; return (
                      <button key={c} type="button" role="radio" aria-checked={on} onClick={() => { const totalDisp = fieldToTotalDisp(w); onBarChange(model.bar, kg); setBarOpen(false); if (sideMode && totalDisp != null) setW(String(Math.max(0, round((totalDisp - c) / 2, 2)))); }} className={cn("h-8 rounded-full px-3 text-xs tabular ring-1", on ? "bg-ember text-ember-fg ring-ember" : "text-fg-muted ring-white/10 hover:text-fg")}>{c === 0 ? "Not counted" : `${c} ${unit}`}</button>); })}
                  </div>
                ) : null}
              </div>))}
          </div>

          <div className="mt-3 rounded-2xl bg-black/30 p-3 ring-1 ring-white/[0.06]" role="radiogroup" aria-label="Effort">
            <div className="flex items-center justify-between"><span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Effort</span><span className="text-2xs text-fg-subtle">{rpe != null ? (rpe >= 10 ? "RPE 10 · nothing left" : `RPE ${rpe} · ${RPE_WORDS[Math.round(rpe)] ?? ""} in the tank`) : "how hard was it"}</span></div>
            <div className="mt-2 grid grid-cols-5 gap-1.5">{[6, 7, 8, 9, 10].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rpe === n} onClick={() => setRpe(n)} className={cn("flex h-12 min-w-0 touch-manipulation flex-col items-center justify-center rounded-xl transition-all", rpe === n ? "bg-ember text-ember-fg shadow-glow" : "bg-white/[0.05] text-fg-muted hover:bg-white/10")}><span className="font-display text-lg font-semibold leading-tight tabular">{n}</span><span className="whitespace-nowrap text-[9px] uppercase tracking-wide opacity-80">{RPE_WORDS[n]}</span></button>))}</div>
          </div>

          {challenge ? (
            <div className="mt-3 rounded-2xl border border-amber/40 bg-amber-soft p-3 text-sm" role="alert">
              <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" /><div><p className="font-medium">That looks unusual.</p><p className="text-fg-muted">{challenge} It will be logged but will not count as a record until you repeat it.</p></div></div>
              <div className="mt-2 flex gap-2"><Button size="sm" variant="secondary" onClick={() => setChallenge(null)}>Edit</Button><Button size="sm" loading={busy} onClick={() => submit(true)}>It's right, log it</Button></div>
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <Button className="h-13 flex-1 text-base shadow-glow" loading={busy} onClick={() => submit(false)} aria-label={done ? "Update set" : "Log set"}>{done ? "Update set" : "Log set"} <Check /></Button>
            {inst.loggedSets.some((l) => l.completed) ? <Button variant="ghost" onClick={onReset} aria-label="Restart exercise"><RotateCcw /></Button> : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function SwapList({ instanceId, onPick }: { instanceId: string; onPick: (e: ExerciseSummary, permanent: boolean) => void }) {
  const [subs, setSubs] = useState<{ exercise: ExerciseSummary; reason: string }[] | null>(null);
  const [permanent, setPermanent] = useState(false);
  useEffect(() => { fetch(`/api/instance/${instanceId}/substitutes`).then((r) => r.json()).then(setSubs).catch(() => setSubs([])); }, [instanceId]);
  return (
    <div className="space-y-3">
      <Segmented value={permanent ? "always" : "today"} onChange={(v) => setPermanent(v === "always")} options={[{ value: "today", label: "Just today" }, { value: "always", label: "Rest of programme" }]} label="Swap scope" />
      {subs === null ? <p className="text-sm text-fg-subtle">Finding alternatives…</p> : subs.length === 0 ? <p className="text-sm text-fg-subtle">No close alternatives with your equipment. Try the library.</p> : subs.map((s) => (
        <button key={s.exercise.id} type="button" onClick={() => onPick(s.exercise, permanent)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left hover:border-border-strong">
          {s.exercise.imageUrls[0] ? <img src={s.exercise.imageUrls[0]} alt="" className="size-14 rounded-md object-cover" /> : <div className="size-14 rounded-md bg-surface-3" />}
          <div className="min-w-0"><div className="truncate font-medium">{s.exercise.name}</div><div className="text-xs text-fg-subtle">{s.reason}</div></div>
        </button>
      ))}
    </div>
  );
}

function FinishForm({ sessionId, onDone }: { sessionId: string; units: "metric" | "imperial"; onDone: () => void }) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ changes: { name: string; change: string; nextWeightKg: number | null; reason: string }[] } | null>(null);
  async function submit() {
    setBusy(true);
    await flush();
    const r = await postResilient<{ changes: { name: string; change: string; nextWeightKg: number | null; reason: string }[] }>(`/api/session/${sessionId}/complete`, { sessionRpe: rpe, soreness, fatigue, mood, notes: notes || null }).catch(() => null);
    setBusy(false);
    if (!r) return toast.error("Couldn't save");
    if (!r.ok) { toast.message("Saved on this device", { description: "Your session will be completed and the next loads set when you're back online." }); setResult({ changes: [] }); return; }
    setResult(r.data);
  }
  const Scale = ({ label, value, set, lo, hi }: { label: string; value: number | null; set: (v: number) => void; lo: string; hi: string }) => (
    <div><div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{label}</span><span className="text-xs text-fg-subtle">{lo} → {hi}</span></div><div className="grid grid-cols-5 gap-1.5">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-pressed={value === n} onClick={() => set(n)} className={cn("h-10 rounded-md text-sm font-medium", value === n ? "bg-ember text-ember-fg" : "bg-surface-2 hover:bg-surface-3")}>{n}</button>)}</div></div>
  );
  if (result) return (
    <div className="space-y-4">
      <div className="rounded-xl bg-signal-soft p-4"><div className="font-display text-lg font-semibold">Session logged.</div><p className="text-sm text-fg-muted">Here's what changes next time, and why.</p></div>
      <ul className="space-y-2">{result.changes.map((c) => (<li key={c.name} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-center justify-between"><span className="font-medium">{c.name}</span><Badge tone={c.change === "up" ? "signal" : c.change === "down" ? "amber" : "neutral"}>{c.change === "up" ? "Load up" : c.change === "down" ? "Load down" : "Hold"}</Badge></div><p className="mt-1 text-fg-muted">{c.reason}</p></li>))}{!result.changes.length && <li className="text-sm text-fg-subtle">Log weights next time and the plan will progress them for you.</li>}</ul>
      <Button className="w-full" size="lg" onClick={onDone}>Done</Button>
    </div>
  );
  return (
    <div className="space-y-5">
      <div><div className="mb-1.5 text-sm font-medium">Session RPE</div><div className="grid grid-cols-6 gap-1.5">{[5, 6, 7, 8, 9, 10].map((n) => <button key={n} type="button" aria-pressed={rpe === n} onClick={() => setRpe(n)} className={cn("h-10 rounded-md text-sm font-medium", rpe === n ? "bg-ember text-ember-fg" : "bg-surface-2 hover:bg-surface-3")}>{n}</button>)}</div></div>
      <Scale label="Soreness" value={soreness} set={setSoreness} lo="none" hi="can't sit" />
      <Scale label="Fatigue" value={fatigue} set={setFatigue} lo="fresh" hi="wrecked" />
      <Scale label="Enjoyment" value={mood} set={setMood} lo="dreaded it" hi="loved it" />
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering? (optional)" />
      <Button className="w-full" size="lg" onClick={submit} loading={busy}>Save session</Button>
    </div>
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function whenLabelClient(dateIso: string, todayIso: string): string {
  const d = new Date(`${dateIso}T12:00:00Z`), t = new Date(`${todayIso}T12:00:00Z`);
  const days = Math.round((d.getTime() - t.getTime()) / 86400000);
  return days === 1 ? "tomorrow" : WEEKDAYS[d.getUTCDay()]!;
}

/**
 * The benchmark for this lift, right where the numbers are entered: every set from last time (tap one to use it), the
 * heaviest set and the best estimated max, and the full history a tap away.
 */
function Benchmark({ inst, units, onUse }: { inst: Instance; units: "metric" | "imperial"; onUse: (weightKg: number | null, reps: number | null, rpe: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LiftHistoryData | null>(null);
  const b = inst.benchmark;
  const unit = units === "metric" ? "kg" : "lb";
  async function openHistory() {
    setOpen(true);
    if (!data) { const r = await fetch(`/api/exercise/${inst.exerciseId}/history`); if (r.ok) setData(await r.json()); }
  }
  return (
    <div className="mb-3 rounded-2xl bg-black/25 p-3 ring-1 ring-white/[0.06]">
      {b?.last ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Last time · {dayMonth(b.last.date)}</span>
            <button type="button" onClick={openHistory} className="inline-flex items-center gap-1 text-xs text-ember hover:underline">History <ChevronRight className="size-3.5" /></button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {b.last.sets.map((x, i) => (
              <button key={i} type="button" onClick={() => onUse(x.weightKg, x.reps, x.rpe)} aria-label={`Use ${fmtKg(x.weightKg, units)} ${unit} for ${x.reps} reps`} className="inline-flex h-8 items-center rounded-full bg-white/[0.05] px-3 text-sm tabular text-fg ring-1 ring-white/10 transition-colors hover:bg-white/10 active:scale-95">
                {fmtKg(x.weightKg, units)} × {x.reps}{x.rpe ? <span className="ml-1 text-2xs text-fg-subtle">@{x.rpe}</span> : null}
              </button>))}
          </div>
          {b.bestWeight || b.bestE1rm ? (
            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/5 pt-2.5">
              <div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.12em] text-fg-subtle">Heaviest</div><div className="truncate text-sm font-medium tabular">{b.bestWeight ? `${fmtKg(b.bestWeight.weightKg, units)} ${unit} × ${b.bestWeight.reps}` : "-"}</div></div>
              <div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.12em] text-fg-subtle">Best max</div><div className="truncate text-sm font-medium tabular">{b.bestE1rm ? `${fmtKg(b.bestE1rm.e1rm, units)} ${unit}` : "-"}</div></div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex items-center justify-between gap-3"><p className="text-sm text-fg-muted">First time on this lift. Today&apos;s sets become your benchmark.</p></div>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title={inst.exercise.name} description="Every session you have logged for this lift.">
          {data ? <LiftHistory data={data} units={units} /> : <p className="py-8 text-center text-sm text-fg-subtle">Loading your history</p>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

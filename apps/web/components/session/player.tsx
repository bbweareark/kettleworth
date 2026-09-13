"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Info, Repeat, WifiOff, ShieldAlert, AlertOctagon } from "lucide-react";
import type { LoggedSet, PlannedSet, ExerciseSummary } from "@kettleworth/types";
import { Badge, Button, Card, CardContent, Progress, Sheet, SheetContent, Segmented, Textarea, CoachPulse, cn, toast, type PulseItem } from "@kettleworth/ui";
import { kgToLb, lbToKg, round } from "@kettleworth/core";
import { ExerciseMedia } from "@/components/library/media";
import { RestTimer, ElapsedClock } from "./timer";
import { FormCheck, RestTip, type CheckCard } from "./form-check";
import { PRCelebration } from "./celebrate";
import { postResilient, flush, pending } from "@/lib/offline-queue";

type Exercise = { id: string; slug: string; name: string; primaryMuscles: string[]; equipment: string[]; imageUrls: string[]; cues: string[]; instructions: string[]; commonMistakes: string[]; pattern: string };
type Caution = { level: "info" | "warn" | "stop"; text: string };
type Instance = { id: string; exerciseId: string; order: number; role: string; plannedSets: PlannedSet[]; loggedSets: LoggedSet[]; rationale: string; notes: string | null; exercise: Exercise; lastTime: LoggedSet[] | null; swappedReason: string | null; cautions: Caution[]; video: { provider: string; playbackId: string | null; isPlaceholder: boolean; status: string } | null };
type Detail = { session: { id: string; name: string; status: string; startedAt: string | null; warmup: string[]; estimatedMinutes: number; focus: string[]; readinessScore: number | null; intensityScalar: number }; week: { weekNumber: number; isDeload: boolean } | null; instances: Instance[] };

export function SessionPlayer({ detail, units }: { detail: Detail; units: "metric" | "imperial" }) {
  const router = useRouter();
  const [session, setSession] = useState(detail.session);
  const [instances, setInstances] = useState(detail.instances);
  const [idx, setIdx] = useState(() => Math.max(0, detail.instances.findIndex((i) => i.loggedSets.filter((l) => l.completed).length < i.plannedSets.length)));
  const [rest, setRest] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [pr, setPr] = useState<{ name: string; value: number; units: "metric" | "imperial" } | null>(null);
  const [queued, setQueued] = useState(0);
  const [starting, setStarting] = useState(false);
  const [live, setLive] = useState<PulseItem[]>([]);
  const cur = instances[idx];
  const totalSets = instances.reduce((a, i) => a + i.plannedSets.length, 0);
  const doneSets = instances.reduce((a, i) => a + i.loggedSets.filter((l) => l.completed).length, 0);

  useEffect(() => { pending().then(setQueued); const on = () => flush().then(() => pending().then(setQueued)); window.addEventListener("online", on); return () => window.removeEventListener("online", on); }, []);
  useEffect(() => { if (session.status === "planned") start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const logSet = useCallback(async (inst: Instance, set: PlannedSet, values: { weightKg: number | null; reps: number | null; rpe: number | null }) => {
    const logged: LoggedSet = { setNumber: set.setNumber, reps: values.reps, weightKg: values.weightKg, rpe: values.rpe, durationSeconds: null, completed: true, loggedAt: new Date().toISOString() };
    setInstances((prev) => prev.map((i) => (i.id === inst.id ? { ...i, loggedSets: [...i.loggedSets.filter((l) => l.setNumber !== set.setNumber), logged].sort((a, b) => a.setNumber - b.setNumber) } : i)));
    const r = await postResilient<{ pr: { value: number } | null }>(`/api/instance/${inst.id}/log`, logged);
    if (!r.ok) { setQueued((q) => q + 1); toast.message("Saved on this device", { description: "We'll sync when you're back online.", icon: <WifiOff className="size-4" /> }); }
    else if (r.data.pr) setPr({ name: inst.exercise.name, value: r.data.pr.value, units });
    // Coach reads the set back: on target, above, or below, from the actual numbers.
    const target = set.repRange ?? (set.reps != null ? [set.reps, set.reps] : null);
    const rpeGap = values.rpe != null && set.targetRpe != null ? values.rpe - set.targetRpe : null;
    let read = `Set ${set.setNumber} logged.`;
    if (target && values.reps != null) read = values.reps > target[1] ? `${values.reps} reps beats the ${target[0]}–${target[1]} target. Add load next set if RPE allows.` : values.reps < target[0] ? `${values.reps} reps is under the ${target[0]}–${target[1]} range. Drop 5–7% for the next set.` : `${values.reps} reps, inside the ${target[0]}–${target[1]} range.${rpeGap != null ? (rpeGap <= -1 ? " RPE says you had more: nudge the load up." : rpeGap >= 1.5 ? " RPE ran hot: hold or ease the load." : " Effort on target.") : ""}`;
    setLive([{ text: read, tone: target && values.reps != null && values.reps < target[0] ? "amber" : "signal" }]);
    const isLast = set.setNumber === inst.plannedSets[inst.plannedSets.length - 1]!.setNumber;
    if (!isLast) setRest(set.restSeconds);
    else if (idx < instances.length - 1) { setRest(Math.min(set.restSeconds, 90)); }
  }, [idx, instances.length, units]);

  async function doSwap(to: ExerciseSummary, permanent: boolean) {
    const r = await fetch(`/api/instance/${cur!.id}/swap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toExerciseId: to.id, reason: "user swap", permanent }) });
    if (!r.ok) return toast.error("Couldn't swap");
    const ex = await r.json();
    setInstances((prev) => prev.map((i) => (i.id === cur!.id ? { ...i, exerciseId: ex.id, exercise: ex, plannedSets: i.plannedSets.map((s) => ({ ...s, weightKg: null })), loggedSets: [], swappedReason: "user swap" } : i)));
    setSwapOpen(false);
    toast.success(`Swapped to ${ex.name}${permanent ? " for the rest of the programme" : ""}`);
  }

  if (!cur) return <div className="p-6 text-fg-muted">This session has no exercises.</div>;
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
        <div className="flex items-center gap-3 text-xs">{queued > 0 && <Badge tone="amber"><WifiOff className="size-3" /> {queued} queued</Badge>}<ElapsedClock since={session.startedAt} /></div>
      </div>
      <div><div className="flex items-center gap-2 text-xs text-fg-subtle"><span>{session.name}</span>{detail.week && <span>· Week {detail.week.weekNumber}</span>}{session.readinessScore != null && <Badge tone={session.intensityScalar < 1 ? "amber" : "signal"}>Readiness {session.readinessScore}</Badge>}</div><Progress value={(doneSets / Math.max(1, totalSets)) * 100} className="mt-2" label="Session progress" /></div>
      <CoachPulse label="Live" items={live.length ? live : [{ text: session.intensityScalar < 1 ? `Loads eased ${Math.round((1 - session.intensityScalar) * 100)}% for today's readiness. ${doneSets}/${totalSets} sets.` : `Watching every set. ${doneSets}/${totalSets} done.`, tone: "ember" }]} />

      {idx === 0 && doneSets === 0 && session.warmup.length ? (
        <Card><CardContent className="p-4"><div className="eyebrow mb-2">Warm-up · 8 min</div><ul className="space-y-1 text-sm text-fg-muted">{session.warmup.map((w) => <li key={w} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{w}</li>)}</ul></CardContent></Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="grid sm:grid-cols-[160px_1fr]">
          <div className="p-4 pb-0 sm:pb-4 sm:pr-0"><ExerciseMedia name={cur.exercise.name} images={cur.exercise.imageUrls} video={cur.video} compact className="aspect-[4/3] sm:aspect-square" /></div>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2"><Badge tone={cur.role === "primary" ? "ember" : "neutral"} className="capitalize">{cur.role}</Badge><span className="text-xs text-fg-subtle">Exercise {idx + 1} of {instances.length}</span>{cur.swappedReason && <Badge tone="amber">Swapped</Badge>}</div>
            <h1 className="font-display text-2xl font-semibold tracking-tighter">{cur.exercise.name}</h1>
            <p className="text-sm text-fg-muted">{describePrescription(cur.plannedSets)}</p>
            <p className="text-xs text-fg-subtle">{cur.notes ?? cur.rationale}</p>
            <div className="flex flex-wrap gap-2 pt-1"><Button size="sm" variant="secondary" onClick={() => setShowInfo((s) => !s)} aria-expanded={showInfo}><Info /> How to {showInfo ? <ChevronUp /> : <ChevronDown />}</Button><Button size="sm" variant="secondary" onClick={() => setSwapOpen(true)}><Repeat /> Swap</Button></div>
          </CardContent>
        </div>
        {showInfo && (<div className="border-t border-border bg-surface-2 p-4 text-sm"><div className="grid gap-4 sm:grid-cols-2"><div><div className="eyebrow mb-1">Cues</div><ul className="space-y-1 text-fg-muted">{(cur.exercise.cues.length ? cur.exercise.cues : cur.exercise.instructions.slice(0, 4)).map((c) => <li key={c}>{c}</li>)}</ul></div><div><div className="eyebrow mb-1">Watch for</div><ul className="space-y-1 text-fg-muted">{cur.exercise.commonMistakes.length ? cur.exercise.commonMistakes.map((c) => <li key={c}>{c}</li>) : <li>Control the eccentric; stop 1–2 reps shy of failure unless told otherwise.</li>}</ul>{cur.cautions.filter((c) => c.level === "info").length ? <><div className="eyebrow mb-1 mt-3">Safety</div><ul className="space-y-1 text-fg-muted">{cur.cautions.filter((c) => c.level === "info").map((c, k) => <li key={k}>{c.text}</li>)}</ul></> : null}<Link href={`/library/${cur.exercise.slug}`} className="mt-2 inline-block text-ember hover:underline">Full exercise page</Link></div></div></div>)}
      </Card>

      {!curDone && <FormCheck key={cur.id} exerciseId={cur.exerciseId} name={cur.exercise.name} cards={cards} image={cur.exercise.imageUrls[0]} />}

      {rest != null ? <RestTimer key={rest + "-" + doneSets} seconds={rest} onDone={() => setRest(null)} onSkip={() => setRest(null)}><RestTip cards={restCards} /></RestTimer> : null}

      <Card key={cur.id}><CardContent className="space-y-2 p-4">
        {cur.lastTime?.length ? <div className="mb-2 text-xs text-fg-subtle">Last time: {cur.lastTime.filter((l) => l.completed).map((l) => `${fmtW(l.weightKg, units)}×${l.reps ?? "-"}`).join(", ")}</div> : null}
        {cur.plannedSets.map((s) => <SetRow key={s.setNumber} set={s} logged={cur.loggedSets.find((l) => l.setNumber === s.setNumber) ?? null} units={units} onLog={(v) => logSet(cur, s, v)} />)}
      </CardContent></Card>

      <div className="flex items-center justify-between gap-3 pb-6">
        <Button variant="ghost" disabled={idx === 0} onClick={() => { setIdx((i) => i - 1); setRest(null); }}><ArrowLeft /> Previous</Button>
        {idx < instances.length - 1 ? <Button variant={curDone ? "primary" : "secondary"} onClick={() => { setIdx((i) => i + 1); setRest(null); setShowInfo(false); }}>Next exercise <ArrowRight /></Button> : <Button onClick={() => setFinishOpen(true)} loading={starting}>Finish session <Check /></Button>}
      </div>

      <div className="flex flex-wrap gap-1">{instances.map((i, k) => (<button key={i.id} type="button" onClick={() => { setIdx(k); setRest(null); }} aria-label={`${i.exercise.name}${k === idx ? " (current)" : ""}`} aria-current={k === idx} className={cn("h-2 flex-1 rounded-full transition-colors", i.loggedSets.filter((l) => l.completed).length >= i.plannedSets.length ? "bg-signal" : k === idx ? "bg-ember" : "bg-surface-3")} />))}</div>

      <Sheet open={swapOpen} onOpenChange={setSwapOpen}><SheetContent title="Swap exercise" description="Like-for-like alternatives that fit your equipment and injuries."><SwapList instanceId={cur.id} onPick={doSwap} /></SheetContent></Sheet>
      <Sheet open={finishOpen} onOpenChange={setFinishOpen}><SheetContent title="How did that go?" description="Thirty seconds of feedback shapes next week."><FinishForm sessionId={session.id} units={units} onDone={() => { router.push("/app"); router.refresh(); }} /></SheetContent></Sheet>
    </div>
  );
}

function describePrescription(sets: PlannedSet[]): string {
  const w = sets.filter((s) => s.type === "working");
  if (!w.length) return `${sets.length} sets`;
  const f = w[0]!;
  const reps = f.repRange ? `${f.repRange[0]}–${f.repRange[1]}` : f.reps ?? "";
  return `${w.length} × ${reps}${f.targetRpe ? ` @ RPE ${f.targetRpe}` : ""}${f.targetRir != null ? ` (${f.targetRir} in reserve)` : ""} · ${Math.round(f.restSeconds / 60 * 10) / 10} min rest${f.tempo ? ` · tempo ${f.tempo}` : ""}`;
}
const fmtW = (kg: number | null, units: "metric" | "imperial") => (kg == null ? "-" : units === "metric" ? `${round(kg, 1)}` : `${round(kgToLb(kg), 1)}`);

function SetRow({ set, logged, units, onLog }: { set: PlannedSet; logged: LoggedSet | null; units: "metric" | "imperial"; onLog: (v: { weightKg: number | null; reps: number | null; rpe: number | null }) => void }) {
  const toDisplay = (kg: number | null | undefined) => (kg == null ? "" : String(round(units === "metric" ? kg : kgToLb(kg), 1)));
  const [w, setW] = useState(toDisplay(logged?.weightKg ?? set.weightKg));
  const [r, setR] = useState(logged?.reps != null ? String(logged.reps) : set.reps != null ? String(set.reps) : set.repRange ? String(set.repRange[1]) : "");
  const [rpe, setRpe] = useState(logged?.rpe != null ? String(logged.rpe) : set.targetRpe != null ? String(set.targetRpe) : "");
  const done = !!logged?.completed;
  const submit = () => { const kg = w === "" ? null : units === "metric" ? Number(w) : lbToKg(Number(w)); onLog({ weightKg: kg, reps: r === "" ? null : Number(r), rpe: rpe === "" ? null : Number(rpe) }); };
  return (
    <div className={cn("grid grid-cols-[28px_1fr_1fr_1fr_44px] items-center gap-2 rounded-lg border px-2 py-1.5", done ? "border-signal/30 bg-signal-soft" : "border-border bg-surface-2")}>
      <span className="text-center text-xs text-fg-subtle tabular">{set.type === "warmup" ? "W" : set.setNumber}</span>
      <label className="relative"><span className="sr-only">Weight</span><input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder={units === "metric" ? "kg" : "lb"} className="h-9 w-full rounded-md bg-bg px-2 font-mono text-sm tabular focus:outline-none focus:ring-2 focus:ring-ember/40" /></label>
      <label className="relative"><span className="sr-only">Reps</span><input inputMode="numeric" value={r} onChange={(e) => setR(e.target.value)} placeholder={set.repRange ? `${set.repRange[0]}–${set.repRange[1]}` : "reps"} className="h-9 w-full rounded-md bg-bg px-2 font-mono text-sm tabular focus:outline-none focus:ring-2 focus:ring-ember/40" /></label>
      <label className="relative"><span className="sr-only">RPE</span><input inputMode="decimal" value={rpe} onChange={(e) => setRpe(e.target.value)} placeholder="RPE" className="h-9 w-full rounded-md bg-bg px-2 font-mono text-sm tabular focus:outline-none focus:ring-2 focus:ring-ember/40" /></label>
      <button type="button" onClick={submit} aria-label={done ? "Update set" : "Log set"} className={cn("grid h-9 w-11 place-items-center rounded-md transition-transform active:scale-95", done ? "bg-signal text-black" : "bg-ember text-ember-fg")}><Check className="size-4" /></button>
    </div>
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
    const r = await fetch(`/api/session/${sessionId}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionRpe: rpe, soreness, fatigue, mood, notes: notes || null }) });
    setBusy(false);
    if (!r.ok) return toast.error("Couldn't save");
    setResult(await r.json());
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

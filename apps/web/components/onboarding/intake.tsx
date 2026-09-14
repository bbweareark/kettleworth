"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Search, Sparkles, X } from "lucide-react";
import { TrainingProfile, type Injury, type BaselineMetrics } from "@kettleworth/types";
import { Button, Chip, ChipGroup, Field, Input, Textarea, Segmented, Slider, Card, CardContent, Progress, toast, Badge, cn, BodyShapePicker } from "@kettleworth/ui";
import { computeBaseline, kgToLb, lbToKg, cmToIn, inToCm, round } from "@kettleworth/core";
import { STEPS, type StepId } from "./steps";

type P = Partial<TrainingProfile>;
type Turn = { role: "coach" | "user"; text: string; at: string };
const GOALS: { v: TrainingProfile["goals"][number]; l: string }[] = [{ v: "fat_loss", l: "Lose fat" }, { v: "muscle", l: "Build muscle" }, { v: "strength", l: "Get stronger" }, { v: "endurance", l: "Endurance" }, { v: "general_health", l: "General health" }, { v: "sport", l: "Sport performance" }];
const EQUIPMENT: { v: TrainingProfile["equipment"][number]; l: string }[] = [["barbell", "Barbell"], ["squat_rack", "Squat rack"], ["bench", "Bench"], ["dumbbell", "Dumbbells"], ["kettlebell", "Kettlebells"], ["cable", "Cables"], ["machine", "Machines"], ["smith_machine", "Smith machine"], ["leg_press", "Leg press"], ["pull_up_bar", "Pull-up bar"], ["dip_station", "Dip station"], ["bands", "Bands"], ["trx", "TRX / rings"], ["ez_bar", "EZ bar"], ["trap_bar", "Trap bar"], ["medicine_ball", "Medicine ball"], ["rowing_machine", "Rower"], ["bike", "Bike"], ["treadmill", "Treadmill"], ["foam_roller", "Foam roller"]].map(([v, l]) => ({ v: v as TrainingProfile["equipment"][number], l: l! }));
const STYLES: { v: TrainingProfile["styles"][number]; l: string }[] = [["bodybuilding", "Bodybuilding"], ["powerlifting", "Powerlifting"], ["hiit", "HIIT"], ["calisthenics", "Calisthenics"], ["yoga_mobility", "Yoga / mobility"], ["running", "Running"], ["crossfit", "CrossFit"], ["kettlebell", "Kettlebell"]].map(([v, l]) => ({ v: v as TrainingProfile["styles"][number], l: l! }));
const REGIONS: { v: Injury["region"]; l: string }[] = [["neck", "Neck"], ["shoulder", "Shoulder"], ["elbow", "Elbow"], ["wrist", "Wrist"], ["upper_back", "Upper back"], ["lower_back", "Lower back"], ["hip", "Hip"], ["knee", "Knee"], ["ankle", "Ankle"], ["other", "Other"]].map(([v, l]) => ({ v: v as Injury["region"], l: l! }));
const DIETS: { v: TrainingProfile["dietType"]; l: string }[] = [["omnivore", "Omnivore"], ["pescatarian", "Pescatarian"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["halal", "Halal"], ["kosher", "Kosher"], ["mediterranean", "Mediterranean"], ["keto", "Keto / low-carb"]].map(([v, l]) => ({ v: v as TrainingProfile["dietType"], l: l! }));
const ALLERGENS: { v: TrainingProfile["allergens"][number]; l: string }[] = [["gluten", "Gluten"], ["dairy", "Dairy"], ["eggs", "Eggs"], ["nuts", "Tree nuts"], ["peanuts", "Peanuts"], ["soy", "Soy"], ["shellfish", "Shellfish"], ["fish", "Fish"], ["sesame", "Sesame"]].map(([v, l]) => ({ v: v as TrainingProfile["allergens"][number], l: l! }));
const BIG_LIFTS = [{ id: "barbell-back-squat", name: "Back squat" }, { id: "barbell-bench-press", name: "Bench press" }, { id: "barbell-deadlift", name: "Deadlift" }, { id: "barbell-overhead-press", name: "Overhead press" }, { id: "pull-up", name: "Pull-up (bodyweight + added)" }];

export function Intake({ initial, step, name, ai }: { initial: TrainingProfile | null; step: number; name: string; ai: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [p, setP] = useState<P>(() => initial ?? { units: "metric", experience: "beginner", goals: [], daysPerWeek: 3, sessionMinutes: 60, environment: "gym", equipment: [], styles: [], injuries: [], medicalFlags: [], dietType: "omnivore", allergens: [], dislikedFoods: [], cookingMinutes: 30, budgetTier: "medium", timelineWeeks: 12, knownLifts: [], lovedExerciseIds: [], hatedExerciseIds: [] });
  const [i, setI] = useState(Math.min(step, STEPS.length - 1));
  const [turns, setTurns] = useState<Turn[]>([]);
  const [followUp, setFollowUp] = useState<{ question: string; stage: string } | null>(null);
  const [followAnswer, setFollowAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const stepDef = STEPS[i]!;
  const coachLine = useMemo(() => stepDef.coach(p, name), [stepDef, p, name]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" }); }, [i, followUp, thinking, reduce]);

  const set = (patch: P) => setP((prev) => ({ ...prev, ...patch }));
  const summary = (id: StepId): string => {
    switch (id) {
      case "basics": return `${p.age ?? "?"} years old, ${p.sex ?? "sex not given"}, ${p.units}.`;
      case "body": return `${p.heightCm ? Math.round(p.heightCm) + " cm" : "no height"}, ${p.weightKg ? round(p.weightKg, 1) + " kg" : "no weight"}${p.bodyFatPct ? `, ~${p.bodyFatPct}% body fat` : ""}.`;
      case "experience": return `${p.experience}.`;
      case "goals": return `${(p.goals ?? []).map((g) => GOALS.find((x) => x.v === g)?.l).join(", ")}; main goal ${GOALS.find((x) => x.v === p.primaryGoal)?.l ?? "-"} over ${p.timelineWeeks} weeks.`;
      case "schedule": return `${p.daysPerWeek} days a week, ${p.sessionMinutes} minutes${p.preferredTime ? `, ${p.preferredTime.replace("_", " ")}` : ""}.`;
      case "environment": return `${p.environment}${p.environment !== "gym" ? `: ${(p.equipment ?? []).length ? p.equipment!.join(", ") : "bodyweight only"}` : ""}.`;
      case "styles": return `${(p.styles ?? []).length ? p.styles!.join(", ") : "no strong preference"}${(p.hatedExerciseIds ?? []).length ? `; never: ${p.hatedExerciseIds!.join(", ")}` : ""}.`;
      case "injuries": return (p.injuries ?? []).length || (p.medicalFlags ?? []).length ? `${(p.injuries ?? []).map((x) => `${x.severity} ${x.region.replace("_", " ")}`).join(", ")}${(p.medicalFlags ?? []).length ? `; flags: ${p.medicalFlags!.join(", ")}` : ""}.` : "Nothing to work around.";
      case "lifestyle": return `${p.sleepHours ?? "?"} h sleep, stress ${p.stressLevel ?? "?"}/5.`;
      case "diet": return `${p.dietType}${(p.allergens ?? []).length ? `, avoiding ${p.allergens!.join(", ")}` : ""}.`;
      case "food": return `${(p.dislikedFoods ?? []).length ? `no ${p.dislikedFoods!.join(", ")}; ` : ""}${p.cookingMinutes} min cooking, ${p.budgetTier} budget.`;
      case "lifts": return (p.knownLifts ?? []).length ? p.knownLifts!.map((l) => `${BIG_LIFTS.find((b) => b.id === l.exerciseId)?.name ?? l.exerciseId} ${l.weightKg} kg × ${l.reps}`).join(", ") + "." : "Skipped.";
      default: return "";
    }
  };

  async function save(nextStep: number, extraTurns: Turn[]) {
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patch: p, step: nextStep, transcript: [...turns, ...extraTurns] }) });
    if (!res.ok) { const j = await res.json(); throw new Error(j.issues?.[0] ? `${j.issues[0].path?.join(".")}: ${j.issues[0].message}` : (j.error ?? "Save failed")); }
  }

  async function next() {
    if (busy) return;
    const valid = validate(stepDef.id, p);
    if (valid) return toast.error(valid);
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const newTurns: Turn[] = [{ role: "coach", text: coachLine, at: now }, { role: "user", text: summary(stepDef.id), at: now }];
      await save(i + 1, newTurns);
      setTurns((t) => [...t, ...newTurns]);
      if (ai && ["goals", "injuries", "environment", "diet"].includes(stepDef.id)) {
        setThinking(true);
        const r = await fetch("/api/onboarding/followup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: stepDef.id }), signal: AbortSignal.timeout(15_000) }).then((x) => x.json()).catch(() => null);
        setThinking(false);
        if (r?.question) { setFollowUp({ question: r.question, stage: stepDef.id }); setBusy(false); return; }
      }
      setI((x) => Math.min(x + 1, STEPS.length - 1));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); }
  }
  async function answerFollowUp(skip = false) {
    if (!followUp) return;
    setBusy(true);
    const now = new Date().toISOString();
    const t: Turn[] = [{ role: "coach", text: followUp.question, at: now }, { role: "user", text: skip ? "(skipped)" : followAnswer, at: now }];
    setTurns((x) => [...x, ...t]);
    if (!skip && followAnswer.trim()) {
      setThinking(true);
      await fetch("/api/onboarding/followup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: followUp.stage, question: followUp.question, answer: followAnswer }) }).catch(() => null);
      const fresh = await fetch("/api/profile").then((r) => r.json()).catch(() => null);
      if (fresh?.profile) setP(fresh.profile);
      setThinking(false);
    }
    setFollowUp(null); setFollowAnswer("");
    setI((x) => Math.min(x + 1, STEPS.length - 1));
    setBusy(false);
  }
  async function finish() {
    setBusy(true);
    try {
      await save(STEPS.length, []);
      const r = await fetch("/api/onboarding/complete", { method: "POST" });
      if (!r.ok) throw new Error((await r.json()).error);
      router.push("/app/programme/new");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't finish"); setBusy(false); }
  }

  const baseline = useMemo<BaselineMetrics | null>(() => { try { return computeBaseline(TrainingProfile.parse(p)); } catch { return null; } }, [p]);
  const anim = reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.25 } };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4"><Progress value={((i + (followUp ? 0.5 : 0)) / (STEPS.length - 1)) * 100} label="Intake progress" className="flex-1" /><span className="text-xs tabular text-fg-subtle">{Math.min(i + 1, STEPS.length)}/{STEPS.length}</span></div>
      <div className="space-y-4">
        {turns.slice(-6).map((t, k) => (<div key={k} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", t.role === "coach" ? "bg-surface-2 text-fg-muted" : "ml-auto bg-ember-soft text-fg")}>{t.text}</div>))}
        <AnimatePresence mode="wait">
          <motion.div key={followUp ? "follow" : stepDef.id} {...anim} className="space-y-5">
            <div className="flex items-start gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-full bg-ember text-ember-fg"><Sparkles className="size-4" /></div><p className="rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3 text-base leading-relaxed">{followUp ? followUp.question : coachLine}</p></div>
            {thinking ? <div className="ml-11 flex gap-1 px-2 py-2" aria-label="Coach is thinking"><span className="size-1.5 animate-pulse-soft rounded-full bg-fg-subtle" /><span className="size-1.5 animate-pulse-soft rounded-full bg-fg-subtle [animation-delay:150ms]" /><span className="size-1.5 animate-pulse-soft rounded-full bg-fg-subtle [animation-delay:300ms]" /></div> : null}
            <Card className="ml-0 sm:ml-11"><CardContent className="space-y-5">
              {followUp ? (
                <>
                  <Textarea autoFocus value={followAnswer} onChange={(e) => setFollowAnswer(e.target.value)} placeholder="Type your answer…" />
                  <div className="flex justify-between"><Button variant="ghost" onClick={() => answerFollowUp(true)} disabled={busy}>Skip</Button><Button onClick={() => answerFollowUp()} loading={busy} disabled={!followAnswer.trim()}>Send <ArrowRight /></Button></div>
                </>
              ) : (
                <>
                  <StepBody id={stepDef.id} p={p} set={set} baseline={baseline} />
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0 || busy}><ArrowLeft /> Back</Button>
                    {stepDef.id === "review" ? <Button size="lg" onClick={finish} loading={busy}>Build my programme <Sparkles /></Button> : <Button size="lg" onClick={next} loading={busy}>Continue <ArrowRight /></Button>}
                  </div>
                </>
              )}
            </CardContent></Card>
          </motion.div>
        </AnimatePresence>
        <div ref={bottom} />
      </div>
    </div>
  );
}

function validate(id: StepId, p: P): string | null {
  if (id === "basics" && (!p.age || !p.sex)) return "Age and sex help set safe calorie floors.";
  if (id === "body" && (!p.heightCm || !p.weightKg)) return "Height and weight are needed for your targets.";
  if (id === "goals" && !(p.goals ?? []).length) return "Pick at least one goal.";
  if (id === "environment" && p.environment === "home" && !(p.equipment ?? []).length) return "No kit is fine, but confirm by picking 'Bodyweight only' or some equipment.";
  return null;
}

function NumberInput({ value, onChange, placeholder, suffix, step = 1, min, max }: { value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; suffix?: string; step?: number; min?: number; max?: number }) {
  return (<div className="relative"><Input type="number" inputMode="decimal" step={step} min={min} max={max} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} className="pr-12" />{suffix ? <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">{suffix}</span> : null}</div>);
}

function StepBody({ id, p, set, baseline }: { id: StepId; p: P; set: (x: P) => void; baseline: BaselineMetrics | null }) {
  const imperial = p.units === "imperial";
  const [ft, setFt] = useState<number | undefined>(p.heightCm ? Math.floor(cmToIn(p.heightCm) / 12) : undefined);
  const [inch, setInch] = useState<number | undefined>(p.heightCm ? Math.round(cmToIn(p.heightCm) % 12) : undefined);
  const [foodInput, setFoodInput] = useState("");
  const [hateQ, setHateQ] = useState("");
  const [hateResults, setHateResults] = useState<{ id: string; name: string }[]>([]);
  const [loveQ, setLoveQ] = useState("");
  const [loveResults, setLoveResults] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { if (hateQ.length < 2) return setHateResults([]); const c = new AbortController(); fetch(`/api/library?q=${encodeURIComponent(hateQ)}&limit=6`, { signal: c.signal }).then((r) => r.json()).then((j) => setHateResults(j.items ?? [])).catch(() => {}); return () => c.abort(); }, [hateQ]);
  useEffect(() => { if (loveQ.length < 2) return setLoveResults([]); const c = new AbortController(); fetch(`/api/library?q=${encodeURIComponent(loveQ)}&limit=6`, { signal: c.signal }).then((r) => r.json()).then((j) => setLoveResults(j.items ?? [])).catch(() => {}); return () => c.abort(); }, [loveQ]);
  const toggle = <T,>(arr: T[] | undefined, v: T): T[] => ((arr ?? []).includes(v) ? (arr ?? []).filter((x) => x !== v) : [...(arr ?? []), v]);

  switch (id) {
    case "basics": return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Age"><NumberInput value={p.age} onChange={(v) => set({ age: v })} placeholder="30" min={13} max={100} /></Field>
        <Field label="Units"><Segmented value={p.units ?? "metric"} onChange={(v) => set({ units: v })} options={[{ value: "metric", label: "kg · cm" }, { value: "imperial", label: "lb · ft" }]} label="Units" /></Field>
        <Field label="Sex (for calorie and 1RM formulas)" className="sm:col-span-2"><ChipGroup>{(["male", "female", "other"] as const).map((s) => <Chip key={s} selected={p.sex === s} onClick={() => set({ sex: s })}>{s[0]!.toUpperCase() + s.slice(1)}</Chip>)}</ChipGroup></Field>
      </div>);
    case "body": return (
      <div className="grid gap-4 sm:grid-cols-2">
        {imperial ? (<Field label="Height"><div className="grid grid-cols-2 gap-2"><NumberInput value={ft} suffix="ft" onChange={(v) => { setFt(v); set({ heightCm: v != null ? inToCm(v * 12 + (inch ?? 0)) : undefined }); }} /><NumberInput value={inch} suffix="in" onChange={(v) => { setInch(v); set({ heightCm: ft != null ? inToCm(ft * 12 + (v ?? 0)) : undefined }); }} /></div></Field>) : (<Field label="Height"><NumberInput value={p.heightCm ? Math.round(p.heightCm) : undefined} suffix="cm" onChange={(v) => set({ heightCm: v })} placeholder="178" /></Field>)}
        <Field label="Weight"><NumberInput step={0.1} value={p.weightKg ? round(imperial ? kgToLb(p.weightKg) : p.weightKg, 1) : undefined} suffix={imperial ? "lb" : "kg"} onChange={(v) => set({ weightKg: v == null ? undefined : imperial ? lbToKg(v) : v })} placeholder={imperial ? "176" : "80"} /></Field>
        <Field label="Which is closest to you right now? (optional)" className="sm:col-span-2" hint="A rough visual is all we need. A body check photo refines it later.">
          <BodyShapePicker value={p.bodyFatPct} onChange={(v) => set({ bodyFatPct: v })} sex={p.sex ?? "male"} />
        </Field>
      </div>);
    case "experience": return (
      <div className="grid gap-2">{([["beginner", "Beginner", "New to structured training, or less than 6 months."], ["novice", "Novice", "6 to 18 months, still adding weight most weeks."], ["intermediate", "Intermediate", "1 to 3 years, progress needs planning."], ["advanced", "Advanced", "3+ years, competing or close to genetic ceiling."]] as const).map(([v, l, d]) => (
        <button key={v} type="button" onClick={() => set({ experience: v })} aria-pressed={p.experience === v} className={cn("flex items-start gap-3 rounded-lg border p-4 text-left transition-colors", p.experience === v ? "border-ember bg-ember-soft" : "border-border hover:border-border-strong")}><span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", p.experience === v ? "border-ember bg-ember text-ember-fg" : "border-border-strong")}>{p.experience === v ? <Check className="size-3" /> : null}</span><span><span className="block font-medium">{l}</span><span className="text-sm text-fg-muted">{d}</span></span></button>))}</div>);
    case "goals": return (
      <div className="space-y-5">
        <Field label="Goals"><ChipGroup>{GOALS.map((g) => <Chip key={g.v} selected={(p.goals ?? []).includes(g.v)} onClick={() => { const goals = toggle(p.goals, g.v); set({ goals, primaryGoal: goals.includes(p.primaryGoal!) ? p.primaryGoal : goals[0] }); }}>{g.l}</Chip>)}</ChipGroup></Field>
        {(p.goals ?? []).length > 1 && <Field label="Which matters most?"><ChipGroup>{(p.goals ?? []).map((g) => <Chip key={g} selected={p.primaryGoal === g} onClick={() => set({ primaryGoal: g })}>{GOALS.find((x) => x.v === g)?.l}</Chip>)}</ChipGroup></Field>}
        <Field label={`Timeline: ${p.timelineWeeks} weeks`} hint="8 to 12 weeks is one solid block. Longer goals get multiple blocks."><Slider aria-label="Timeline in weeks" min={4} max={24} step={1} value={[p.timelineWeeks ?? 12]} onValueChange={([v]) => set({ timelineWeeks: v })} /></Field>
      </div>);
    case "schedule": return (
      <div className="space-y-5">
        <Field label="Days per week"><ChipGroup>{[1, 2, 3, 4, 5, 6, 7].map((d) => <Chip key={d} selected={p.daysPerWeek === d} onClick={() => set({ daysPerWeek: d })}>{d}</Chip>)}</ChipGroup></Field>
        <Field label={`Session length: ${p.sessionMinutes} min`}><Slider aria-label="Session minutes" min={20} max={120} step={5} value={[p.sessionMinutes ?? 60]} onValueChange={([v]) => set({ sessionMinutes: v })} /></Field>
        <Field label="Preferred time (optional)"><ChipGroup>{([["early_morning", "Early morning"], ["morning", "Morning"], ["midday", "Midday"], ["afternoon", "Afternoon"], ["evening", "Evening"], ["late", "Late"]] as const).map(([v, l]) => <Chip key={v} selected={p.preferredTime === v} onClick={() => set({ preferredTime: p.preferredTime === v ? undefined : v })}>{l}</Chip>)}</ChipGroup></Field>
      </div>);
    case "environment": return (
      <div className="space-y-5">
        <Field label="Where"><Segmented value={p.environment ?? "gym"} onChange={(v) => set({ environment: v })} options={[{ value: "gym", label: "Gym" }, { value: "home", label: "Home" }, { value: "both", label: "Both" }]} label="Environment" /></Field>
        <Field label={p.environment === "gym" ? "Anything your gym lacks or you have at home? (optional)" : "Equipment you have"} hint={p.environment === "gym" ? "A full commercial gym is assumed." : "Bodyweight is always available."}>
          <ChipGroup>{p.environment !== "gym" && <Chip selected={(p.equipment ?? []).length === 0 && p.environment === "home"} onClick={() => set({ equipment: [] })}>Bodyweight only</Chip>}{EQUIPMENT.map((e) => <Chip key={e.v} selected={(p.equipment ?? []).includes(e.v)} onClick={() => set({ equipment: toggle(p.equipment, e.v) })}>{e.l}</Chip>)}</ChipGroup>
        </Field>
      </div>);
    case "styles": return (
      <div className="space-y-5">
        <Field label="Styles you enjoy"><ChipGroup>{STYLES.map((s) => <Chip key={s.v} selected={(p.styles ?? []).includes(s.v)} onClick={() => set({ styles: toggle(p.styles, s.v) })}>{s.l}</Chip>)}</ChipGroup></Field>
        <Field label="Exercises you love" hint="Search the library. These get priority.">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input className="pl-9" value={loveQ} onChange={(e) => setLoveQ(e.target.value)} placeholder="e.g. hip thrust" /></div>
          {loveResults.length ? <div className="mt-2 flex flex-wrap gap-2">{loveResults.map((r) => <Chip key={r.id} onClick={() => { set({ lovedExerciseIds: [...new Set([...(p.lovedExerciseIds ?? []), r.id])] }); setLoveQ(""); }}>{r.name}</Chip>)}</div> : null}
          {(p.lovedExerciseIds ?? []).length ? <div className="mt-2 flex flex-wrap gap-2">{p.lovedExerciseIds!.map((id) => <Badge key={id} tone="signal" className="normal-case tracking-normal">{id.replace(/-/g, " ")}<button aria-label={`Remove ${id}`} onClick={() => set({ lovedExerciseIds: p.lovedExerciseIds!.filter((x) => x !== id) })}><X className="size-3" /></button></Badge>)}</div> : null}
        </Field>
        <Field label="Exercises you hate" hint="Never programmed. Swaps are always offered anyway.">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input className="pl-9" value={hateQ} onChange={(e) => setHateQ(e.target.value)} placeholder="e.g. burpee" /></div>
          {hateResults.length ? <div className="mt-2 flex flex-wrap gap-2">{hateResults.map((r) => <Chip key={r.id} onClick={() => { set({ hatedExerciseIds: [...new Set([...(p.hatedExerciseIds ?? []), r.id])] }); setHateQ(""); }}>{r.name}</Chip>)}</div> : null}
          {(p.hatedExerciseIds ?? []).length ? <div className="mt-2 flex flex-wrap gap-2">{p.hatedExerciseIds!.map((id) => <Badge key={id} tone="rose" className="normal-case tracking-normal">{id.replace(/-/g, " ")}<button aria-label={`Remove ${id}`} onClick={() => set({ hatedExerciseIds: p.hatedExerciseIds!.filter((x) => x !== id) })}><X className="size-3" /></button></Badge>)}</div> : null}
        </Field>
        <Field label="Music or vibe (optional)"><Input value={p.vibe ?? ""} onChange={(e) => set({ vibe: e.target.value || undefined })} placeholder="Loud, heavy, in and out" maxLength={200} /></Field>
      </div>);
    case "injuries": return (
      <div className="space-y-5">
        <Field label="Injuries or pain" hint="Tap a region, then set how much it limits you.">
          <ChipGroup>{REGIONS.map((r) => { const inj = (p.injuries ?? []).find((x) => x.region === r.v); return <Chip key={r.v} selected={!!inj} onClick={() => set({ injuries: inj ? p.injuries!.filter((x) => x.region !== r.v) : [...(p.injuries ?? []), { region: r.v, severity: "moderate" }] })}>{r.l}</Chip>; })}</ChipGroup>
          {(p.injuries ?? []).map((inj, idx) => (<div key={`${inj.region}-${idx}`} className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-surface-2 p-3"><span className="w-28 text-sm font-medium">{REGIONS.find((r) => r.v === inj.region)?.l}</span><Segmented value={inj.severity} onChange={(v) => set({ injuries: p.injuries!.map((x) => (x.region === inj.region ? { ...x, severity: v } : x)) })} options={[{ value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe" }]} label={`${inj.region} severity`} /><Input className="h-9 flex-1 text-sm" placeholder="Note (optional)" value={inj.note ?? ""} maxLength={300} onChange={(e) => set({ injuries: p.injuries!.map((x) => (x.region === inj.region ? { ...x, note: e.target.value } : x)) })} /></div>))}
        </Field>
        <Field label="Medical conditions (optional)" hint="Stored encrypted. Used only to add safety notes and calorie floors; never sold or used for advertising.">
          <ChipGroup>{["Heart condition", "High blood pressure", "Diabetes", "Pregnancy / postpartum", "Asthma", "Eating disorder history", "Other"].map((f) => <Chip key={f} selected={(p.medicalFlags ?? []).includes(f)} onClick={() => set({ medicalFlags: toggle(p.medicalFlags, f) })}>{f}</Chip>)}</ChipGroup>
        </Field>
      </div>);
    case "lifestyle": return (
      <div className="space-y-5">
        <Field label={`Sleep: ${p.sleepHours ?? 7} hours`}><Slider aria-label="Sleep hours" min={4} max={10} step={0.5} value={[p.sleepHours ?? 7]} onValueChange={([v]) => set({ sleepHours: v })} /></Field>
        <Field label="Stress"><ChipGroup>{[[1, "Very low"], [2, "Low"], [3, "Moderate"], [4, "High"], [5, "Very high"]].map(([v, l]) => <Chip key={v} selected={p.stressLevel === v} onClick={() => set({ stressLevel: v as number })}>{l as string}</Chip>)}</ChipGroup></Field>
      </div>);
    case "diet": return (
      <div className="space-y-5">
        <Field label="Diet type"><ChipGroup>{DIETS.map((d) => <Chip key={d.v} selected={p.dietType === d.v} onClick={() => set({ dietType: d.v })}>{d.l}</Chip>)}</ChipGroup></Field>
        <Field label="Allergies and intolerances"><ChipGroup>{ALLERGENS.map((a) => <Chip key={a.v} selected={(p.allergens ?? []).includes(a.v)} onClick={() => set({ allergens: toggle(p.allergens, a.v) })}>{a.l}</Chip>)}</ChipGroup></Field>
      </div>);
    case "food": return (
      <div className="space-y-5">
        <Field label="Foods you dislike" hint="Press Enter to add.">
          <Input value={foodInput} onChange={(e) => setFoodInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && foodInput.trim()) { e.preventDefault(); set({ dislikedFoods: [...new Set([...(p.dislikedFoods ?? []), foodInput.trim().toLowerCase()])] }); setFoodInput(""); } }} placeholder="e.g. mushrooms" />
          {(p.dislikedFoods ?? []).length ? <div className="mt-2 flex flex-wrap gap-2">{p.dislikedFoods!.map((f) => <Badge key={f} tone="rose" className="normal-case tracking-normal">{f}<button aria-label={`Remove ${f}`} onClick={() => set({ dislikedFoods: p.dislikedFoods!.filter((x) => x !== f) })}><X className="size-3" /></button></Badge>)}</div> : null}
        </Field>
        <Field label={`Cooking time per meal: ${p.cookingMinutes} min`}><Slider aria-label="Cooking minutes" min={5} max={60} step={5} value={[p.cookingMinutes ?? 30]} onValueChange={([v]) => set({ cookingMinutes: v })} /></Field>
        <Field label="Grocery budget"><Segmented value={p.budgetTier ?? "medium"} onChange={(v) => set({ budgetTier: v })} options={[{ value: "low", label: "Tight" }, { value: "medium", label: "Moderate" }, { value: "high", label: "Flexible" }]} label="Budget" /></Field>
      </div>);
    case "lifts": return (
      <div className="space-y-3">
        {BIG_LIFTS.map((l) => { const k = (p.knownLifts ?? []).find((x) => x.exerciseId === l.id); return (
          <div key={l.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg bg-surface-2 p-3"><span className="text-sm font-medium">{l.name}</span>
            <NumberInput step={0.5} value={k?.weightKg != null ? round(imperial ? kgToLb(k.weightKg) : k.weightKg, 1) : undefined} suffix={imperial ? "lb" : "kg"} onChange={(v) => { const w = v == null ? undefined : imperial ? lbToKg(v) : v; const rest = (p.knownLifts ?? []).filter((x) => x.exerciseId !== l.id); set({ knownLifts: w ? [...rest, { exerciseId: l.id, weightKg: w, reps: k?.reps ?? 5 }] : rest }); }} />
            <NumberInput value={k?.reps} suffix="reps" min={1} max={30} onChange={(v) => { if (!k) return; set({ knownLifts: (p.knownLifts ?? []).map((x) => (x.exerciseId === l.id ? { ...x, reps: v ?? 5 } : x)) }); }} />
          </div>); })}
      </div>);
    case "review": return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">{STEPS.filter((s) => s.id !== "review").map((s) => (<div key={s.id} className="rounded-lg bg-surface-2 p-3"><div className="eyebrow mb-1">{s.id.replace("_", " ")}</div><div className="text-sm">{(function () { return summaryFor(s.id, p); })()}</div></div>))}</div>
        {baseline ? (<div className="rounded-xl border border-border p-4"><h3 className="font-display mb-3 text-lg font-semibold">Your baseline</h3><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[["BMI", baseline.bmi], ["BMR", baseline.bmr, "kcal"], ["Maintenance", baseline.tdee, "kcal"], ["Target", baseline.targetCalories, "kcal"]].map(([l, v, u]) => (<div key={l as string}><div className="text-2xs uppercase tracking-wide text-fg-subtle">{l as string}</div><div className="font-display text-xl font-semibold tabular">{v ?? "-"} <span className="text-xs font-normal text-fg-muted">{u as string}</span></div></div>))}</div>{baseline.proteinG ? <p className="mt-3 text-sm text-fg-muted">Macros: {baseline.proteinG} g protein · {baseline.carbsG} g carbs · {baseline.fatG} g fat</p> : null}<ul className="mt-3 space-y-1.5 text-sm text-fg-muted">{baseline.explanations.map((e) => <li key={e} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{e}</li>)}</ul></div>) : null}
        <p className="text-xs text-fg-subtle">Not medical advice. Kettleworth builds general fitness guidance from what you've told us; check with a professional if you have a medical condition.</p>
      </div>);
  }
}
function summaryFor(id: StepId, p: P): string {
  const g = (v?: string) => GOALS.find((x) => x.v === v)?.l ?? "-";
  switch (id) {
    case "basics": return `${p.age ?? "?"} · ${p.sex ?? "?"} · ${p.units}`;
    case "body": return `${p.heightCm ? Math.round(p.heightCm) + " cm" : "?"} · ${p.weightKg ? round(p.weightKg, 1) + " kg" : "?"}${p.bodyFatPct ? ` · ~${p.bodyFatPct}%` : ""}`;
    case "experience": return p.experience ?? "";
    case "goals": return `${(p.goals ?? []).map((x) => g(x)).join(", ")} · main: ${g(p.primaryGoal)} · ${p.timelineWeeks} wks`;
    case "schedule": return `${p.daysPerWeek} days · ${p.sessionMinutes} min`;
    case "environment": return `${p.environment}${p.environment !== "gym" ? ` · ${(p.equipment ?? []).length ? p.equipment!.length + " items" : "bodyweight"}` : ""}`;
    case "styles": return `${(p.styles ?? []).join(", ") || "any"} · ${(p.lovedExerciseIds ?? []).length} loved · ${(p.hatedExerciseIds ?? []).length} hated`;
    case "injuries": return `${(p.injuries ?? []).length} injuries · ${(p.medicalFlags ?? []).length} flags`;
    case "lifestyle": return `${p.sleepHours ?? "?"} h sleep · stress ${p.stressLevel ?? "?"}/5`;
    case "diet": return `${p.dietType} · ${(p.allergens ?? []).join(", ") || "no allergies"}`;
    case "food": return `${p.cookingMinutes} min · ${p.budgetTier} budget · ${(p.dislikedFoods ?? []).length} dislikes`;
    case "lifts": return `${(p.knownLifts ?? []).length} lifts given`;
    default: return "";
  }
}

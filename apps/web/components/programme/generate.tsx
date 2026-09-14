"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import type { TrainingProfile } from "@kettleworth/types";
import { Button, Card, CardContent, Segmented, toast } from "@kettleworth/ui";

const STAGES = ["Reading your answers", "Matching them against the evidence base", "Choosing the split for your week", "Selecting exercises you can actually do", "Setting sets, reps, loads and rest", "Building three blocks with deloads", "Writing your coach note"];

export function GenerateProgramme({ summary, profile, ai, continueFrom = false, defaultWeeks }: { summary: string | null; profile: TrainingProfile; ai: boolean; continueFrom?: boolean; defaultWeeks?: number }) {
  const [weeks, setWeeks] = useState<number>(defaultWeeks ?? profile.timelineWeeks);
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  useEffect(() => { if (!busy) return; const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900); return () => clearInterval(t); }, [busy]);
  async function go() {
    setBusy(true);
    try {
      const r = await fetch("/api/programme/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ continueFrom, weeks }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Generation failed");
      toast.success(`Programme ready: ${j.name}`);
      router.push("/app/programme");
      router.refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><p className="eyebrow">Programme</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{continueFrom ? "Next block." : "Let's build your block."}</h1></div>
      <Card><CardContent className="space-y-4">
        <p className="text-fg-muted">{continueFrom ? "Your main lifts carry over with loads set from what you logged; accessories rotate so the same muscles get a new stimulus. Pick how long the next block should run." : summary ?? `A ${profile.daysPerWeek}-day plan for ${profile.primaryGoal.replace("_", " ")} over ${profile.timelineWeeks} weeks.`}</p>
        <Segmented value={String(weeks)} onChange={(v) => setWeeks(Number(v))} options={[{ value: "4", label: "4 weeks" }, { value: "8", label: "8 weeks" }, { value: "12", label: "12 weeks" }, { value: "16", label: "16 weeks" }]} label="Block length" />
        <ul className="grid gap-2 text-sm sm:grid-cols-2">{[[`${profile.daysPerWeek} days / week`, `${profile.sessionMinutes} min sessions`], [`Goal: ${profile.primaryGoal.replace("_", " ")}`, `${weeks} weeks`], [`${profile.environment} training`, `${profile.experience} level`], [`Variety: ${profile.varietyPreference}`, `${profile.injuries.length} injuries respected`]].flat().map((t) => <li key={t} className="rounded-md bg-surface-2 px-3 py-2 capitalize">{t}</li>)}</ul>
        {busy ? (
          <div className="space-y-2 pt-2" aria-live="polite">{STAGES.map((s, i) => (<motion.div key={s} initial={reduce ? false : { opacity: 0, x: -6 }} animate={{ opacity: i <= stage ? 1 : 0.35, x: 0 }} className="flex items-center gap-3 text-sm"><span className={`size-2 rounded-full ${i < stage ? "bg-signal" : i === stage ? "bg-ember animate-pulse-soft" : "bg-surface-3"}`} />{s}{i === STAGES.length - 1 && !ai ? " (templated on this server)" : ""}</motion.div>))}</div>
        ) : (
          <div className="flex flex-wrap gap-3 pt-2"><Button size="lg" onClick={go}>{continueFrom ? "Build next block" : "Generate programme"} <Sparkles /></Button><Button size="lg" variant="ghost" onClick={() => router.push("/app/settings")}>Edit profile first</Button></div>
        )}
        <p className="text-xs text-fg-subtle">The engine builds the plan from your answers and the evidence base; {ai ? "your coach writes the narrative and the follow-ups" : "coach notes are templated on this server"}. Every exercise carries a one-line reason.</p>
      </CardContent></Card>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import type { TrainingProfile } from "@kettleworth/types";
import { Button, Card, CardContent, toast } from "@kettleworth/ui";

const STAGES = ["Reading your profile", "Choosing the split", "Selecting exercises you can actually do", "Setting sets, reps and rest", "Building 3 mesocycles with deloads", "Writing the coach note"];

export function GenerateProgramme({ summary, profile, ai }: { summary: string | null; profile: TrainingProfile; ai: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  useEffect(() => { if (!busy) return; const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900); return () => clearInterval(t); }, [busy]);
  async function go() {
    setBusy(true);
    try {
      const r = await fetch("/api/programme/generate", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Generation failed");
      toast.success(`Programme ready: ${j.name}`);
      router.push("/app/programme");
      router.refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><p className="eyebrow">Programme</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">Let's build your block.</h1></div>
      <Card><CardContent className="space-y-4">
        <p className="text-fg-muted">{summary ?? `A ${profile.daysPerWeek}-day plan for ${profile.primaryGoal.replace("_", " ")} over ${profile.timelineWeeks} weeks.`}</p>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">{[[`${profile.daysPerWeek} days / week`, `${profile.sessionMinutes} min sessions`], [`Goal: ${profile.primaryGoal.replace("_", " ")}`, `${profile.timelineWeeks} weeks`], [`${profile.environment} training`, `${profile.experience} level`], [`Variety: ${profile.varietyPreference}`, `${profile.injuries.length} injuries respected`]].flat().map((t) => <li key={t} className="rounded-md bg-surface-2 px-3 py-2 capitalize">{t}</li>)}</ul>
        {busy ? (
          <div className="space-y-2 pt-2" aria-live="polite">{STAGES.map((s, i) => (<motion.div key={s} initial={reduce ? false : { opacity: 0, x: -6 }} animate={{ opacity: i <= stage ? 1 : 0.35, x: 0 }} className="flex items-center gap-3 text-sm"><span className={`size-2 rounded-full ${i < stage ? "bg-signal" : i === stage ? "bg-ember animate-pulse-soft" : "bg-surface-3"}`} />{s}{i === STAGES.length - 1 && !ai ? " (templated; add an API key for AI coaching)" : ""}</motion.div>))}</div>
        ) : (
          <div className="flex flex-wrap gap-3 pt-2"><Button size="lg" onClick={go}>Generate programme <Sparkles /></Button><Button size="lg" variant="ghost" onClick={() => router.push("/app/settings")}>Edit profile first</Button></div>
        )}
        <p className="text-xs text-fg-subtle">The rules engine builds the plan deterministically from your profile; {ai ? "the AI coach writes the narrative and follow-ups" : "the AI coach is off on this server, so notes are templated"}. Every exercise carries a one-line reason.</p>
      </CardContent></Card>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, Play, Sparkles } from "lucide-react";
import { Badge, Button, Card, CardContent, CoachPulse, CountUp, Ring, Sparkline, type PulseItem } from "@kettleworth/ui";
import { requireUser } from "@/lib/session";
import { getProfile, getActiveProgramme, getTodaySession, upcomingSessions, getReadiness, getProgress, ensureNutritionPlan, connectedProviders, activitiesForDay, getSessionDetail } from "@kettleworth/api";
import { kgToLb } from "@kettleworth/core";
import { ActivityLog } from "@/components/today/activity-log";

export const dynamic = "force-dynamic";

export default async function Today() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [prog, today, upcoming, readiness, progress, nutrition, providers, activities] = await Promise.all([getActiveProgramme(user.id), getTodaySession(user.id), upcomingSessions(user.id, 7), getReadiness(user.id), getProgress(user.id), ensureNutritionPlan(user.id), connectedProviders(user.id), activitiesForDay(user.id)]);
  const detail = today ? await getSessionDetail(user.id, today.id) : null;
  const units = rec.profile.units;
  const w = (kg: number) => Math.round(units === "metric" ? kg : kgToLb(kg));
  const u = units === "metric" ? "kg" : "lb";
  const firstName = user.name.split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const tone = readiness.band === "high" ? "signal" : readiness.band === "moderate" ? "amber" : readiness.band === "low" ? "rose" : "sky";

  // Everything the pulse says is computed above; nothing here is decorative.
  const pulse: PulseItem[] = [];
  if (readiness.score != null) pulse.push({ text: `Readiness ${readiness.score}. ${readiness.reasons[readiness.reasons.length - 1] ?? ""}`, tone: tone === "rose" ? "amber" : tone === "sky" ? "sky" : tone });
  else pulse.push({ text: "No recovery signal yet. Log sleep or connect a wearable and I'll calibrate your loads.", tone: "sky" });
  for (const r of readiness.reasons.slice(0, -1)) pulse.push({ text: r, tone: "neutral" });
  if (detail?.instances.length) { const loads = detail.instances.filter((i) => i.plannedSets.some((s) => s.type === "working" && s.weightKg != null)); pulse.push({ text: loads.length ? `${loads.length} of ${detail.instances.length} exercises have calibrated targets for today.` : `First time on these lifts: I'll set targets from what you log today.`, tone: "ember" }); }
  if (progress.tonnageLastWeek && progress.tonnageThisWeek) pulse.push({ text: `Volume ${progress.tonnageThisWeek >= progress.tonnageLastWeek ? "up" : "down"} ${Math.abs(Math.round(((progress.tonnageThisWeek - progress.tonnageLastWeek) / progress.tonnageLastWeek) * 100))}% on last week.`, tone: "neutral" });
  if (progress.prs[0]) pulse.push({ text: `Latest PR: ${progress.prs[0].name}, e1RM ${w(progress.prs[0].value)} ${u}.`, tone: "signal" });
  if (progress.streakWeeks > 1) pulse.push({ text: `${progress.streakWeeks}-week streak. Consistency is doing the work.`, tone: "ember" });
  pulse.push({ text: `Nutrition target ${nutrition.targets.calories} kcal · ${nutrition.targets.proteinG} g protein, ${activities.length ? "adjusted for today's activity" : "recalibrated weekly from your weigh-ins"}.`, tone: "neutral" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{greet}, {firstName}.</h1></div>
        {progress.streakWeeks > 0 && <Badge tone="ember"><Flame className="size-3" /> {progress.streakWeeks}-week streak</Badge>}
      </div>
      <CoachPulse items={pulse} />

      {!prog ? (
        <Card className="animate-fade-up"><CardContent className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display text-xl font-semibold">Profile ready. Let's build the block.</h2><p className="mt-1 text-sm text-fg-muted">{rec.aiSummary ?? "A periodised plan from your goals, schedule and equipment."}</p></div>
          <Button asChild size="lg"><Link href="/app/programme/new">Generate programme <Sparkles /></Link></Button>
        </CardContent></Card>
      ) : today ? (
        <Card className="relative animate-fade-up overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-40 blur-3xl" style={{ background: `color-mix(in oklch, var(--color-${tone}) 60%, transparent)` }} />
          <CardContent className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2"><Badge tone={today.status === "in_progress" ? "signal" : "ember"}>{today.status === "in_progress" ? "In progress" : (today as { isOverdue?: boolean }).isOverdue ? "Overdue" : (today as { isToday?: boolean }).isToday ? "Today" : new Date(today.scheduledOn).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</Badge><span className="text-xs text-fg-subtle">~{today.estimatedMinutes} min · {today.focus.slice(0, 3).map((m) => m.replace("_", " ")).join(" · ")}</span></div>
              <h2 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{today.name}</h2>
              {detail?.instances.length ? (
                <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Exercises in this session">
                  {detail.instances.map((i) => (<li key={i.id} className="flex w-[104px] shrink-0 flex-col gap-1.5"><div className="relative aspect-square overflow-hidden rounded-lg bg-surface-3">{i.exercise.imageUrls[0] ? <img src={i.exercise.imageUrls[0]} alt="" className="size-full object-cover" loading="lazy" /> : null}{i.cautions.some((c) => c.level !== "info") ? <span className="absolute left-1 top-1 rounded-full bg-amber px-1.5 text-2xs font-semibold text-black">care</span> : null}</div><span className="truncate text-2xs text-fg-muted">{i.exercise.name}</span></li>))}
                </ul>
              ) : null}
              <div className="flex gap-2"><Button asChild size="lg"><Link href={`/app/session/${today.id}`}>{today.status === "in_progress" ? "Continue" : "Start session"} <Play /></Link></Button><Button asChild variant="secondary" size="lg"><Link href="/app/programme">This week</Link></Button></div>
            </div>
            <Ring value={readiness.score != null ? readiness.score / 100 : 0} size={148} stroke={12} tone={tone} label={`Readiness ${readiness.score ?? "unknown"}`}>
              <div className="text-center"><div className="font-display text-4xl font-semibold tracking-tighter">{readiness.score != null ? <CountUp value={readiness.score} /> : "-"}</div><div className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">Readiness</div></div>
            </Ring>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="flex items-center justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Block complete.</h2><p className="text-sm text-fg-muted">Time to build the next one.</p></div><Button asChild><Link href="/app/programme/new?continue=1">Build next block <ArrowRight /></Link></Button></CardContent></Card>
      )}

      <div className="grid grid-cols-2 divide-x divide-border rounded-2xl bg-surface/50 ring-1 ring-white/[0.04] lg:grid-cols-4">
        <Tile label="Sessions" value={progress.completedSessions} hint={prog ? `of ${prog.totalWeeks * prog.daysPerWeek}` : undefined} spark={progress.weeklyTonnage.map((x) => x.kg)} />
        <Tile label={`Volume · ${u}`} value={w(progress.tonnageThisWeek)} hint={progress.tonnageLastWeek ? `${progress.tonnageThisWeek >= progress.tonnageLastWeek ? "+" : ""}${Math.round(((progress.tonnageThisWeek - progress.tonnageLastWeek) / progress.tonnageLastWeek) * 100)}% wk/wk` : "this week"} spark={progress.weeklyTonnage.map((x) => x.kg)} tone="sky" />
        <Tile label="Calories" value={nutrition.targets.calories} hint={`${nutrition.targets.proteinG} g protein`} />
        <Tile label={`Weight · ${u}`} value={progress.measurements.at(-1)?.weightKg != null ? w(progress.measurements.at(-1)!.weightKg!) : 0} hint={progress.measurements.length > 1 ? `${progress.measurements.length} check-ins` : "log a weigh-in"} spark={progress.measurements.filter((m) => m.weightKg != null).map((m) => m.weightKg!)} tone="signal" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="font-display text-base font-semibold">Week ahead</h3><Link href="/app/programme" className="text-xs text-ember hover:underline">Programme</Link></div>
          {upcoming.length ? (<ul className="grid gap-2 sm:grid-cols-2">{upcoming.slice(0, 4).map((s) => (<li key={s.id}><Link href={`/app/session/${s.id}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-border-strong hover:bg-surface-2"><span><span className="block font-medium">{s.name}</span><span className="text-xs text-fg-subtle">{new Date(s.scheduledOn).toLocaleDateString("en-GB", { weekday: "long" })} · {s.estimatedMinutes} min</span></span><ArrowRight className="size-4 text-fg-subtle" /></Link></li>))}</ul>) : <p className="text-sm text-fg-muted">Generate a programme to fill your week.</p>}
        </CardContent></Card>
        <div className="space-y-3">
          <ActivityLog initial={activities} />
          {!providers.length && <Link href="/app/connected" className="block rounded-xl border border-dashed border-border-strong p-4 text-sm text-fg-muted transition-colors hover:border-ember hover:text-fg">Connect Whoop, Oura, Garmin, Fitbit, Polar or Strava and readiness calibrates itself every morning.</Link>}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, hint, spark, tone = "ember" }: { label: string; value: number; hint?: string; spark?: number[]; tone?: "ember" | "signal" | "sky" | "amber" }) {
  return (
    <div className="flex items-end justify-between gap-2 p-4">
      <div><div className="eyebrow">{label}</div><div className="font-display mt-1 text-3xl font-semibold tracking-tighter"><CountUp value={value} /></div>{hint ? <div className="mt-0.5 text-xs text-fg-subtle">{hint}</div> : null}</div>
      {spark && spark.length > 1 ? <Sparkline points={spark} tone={tone} /> : null}
    </div>
  );
}

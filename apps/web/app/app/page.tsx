import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, Play, Sparkles } from "lucide-react";
import { Badge, Button, Card, CardContent, CoachPulse, CountUp, Ring, Sparkline, type PulseItem } from "@kettleworth/ui";
import { requireUser } from "@/lib/session";
import { getProfile, getActiveProgramme, getTodaySession, upcomingSessions, getReadiness, getProgress, ensureNutritionPlan, connectedProviders, activitiesForDay, getSessionDetail, hasUnreadLetter, listPhotos, runWeeklyAdaptation, currentWeekState } from "@kettleworth/api";
import { kgToLb, ritualNudges } from "@kettleworth/core";
import { ActivityLog } from "@/components/today/activity-log";
import { HeroSession } from "@/components/app/hero-session";
import { sessionArt } from "@/lib/art";
import { OfflineWarmup } from "@/components/app/offline-warmup";
import { WeeklyCheckIn } from "@/components/today/check-in";

export const dynamic = "force-dynamic";

export default async function Today() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  await runWeeklyAdaptation(user.id).catch((e) => console.warn("weekly adaptation", e));
  const weekState = await currentWeekState(user.id);
  const [prog, today, upcoming, readiness, progress, nutrition, providers, activities] = await Promise.all([getActiveProgramme(user.id), getTodaySession(user.id), upcomingSessions(user.id, 7), getReadiness(user.id), getProgress(user.id), ensureNutritionPlan(user.id), connectedProviders(user.id), activitiesForDay(user.id)]);
  const detail = today ? await getSessionDetail(user.id, today.id) : null;
  const [unread, photos] = await Promise.all([hasUnreadLetter(user.id), listPhotos(user.id)]);
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const nudges = ritualNudges(rec.profile, { now: new Date(), weighedInToday: progress.measurements.some((m) => m.measuredOn === todayIso), photoThisWeek: photos.some((p) => p.takenOn >= weekAgo), sessionToday: !!today && (today as { isToday?: boolean }).isToday === true, sessionDone: today?.status === "completed", letterUnread: unread });
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
  if (weekState?.week.adaptations.length) pulse.push({ text: `This week: ${weekState.week.adaptations[weekState.week.adaptations.length - 1]!.reason}`, tone: "ember" });
  if (progress.prs[0]) pulse.push({ text: `Latest PR: ${progress.prs[0].name}, e1RM ${w(progress.prs[0].value)} ${u}.`, tone: "signal" });
  if (progress.streakWeeks > 1) pulse.push({ text: `${progress.streakWeeks}-week streak. Consistency is doing the work.`, tone: "ember" });
  pulse.push({ text: `Nutrition target ${nutrition.targets.calories} kcal · ${nutrition.targets.proteinG} g protein, ${activities.length ? "adjusted for today's activity" : "recalibrated weekly from your weigh-ins"}.`, tone: "neutral" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{greet}, {firstName}.</h1></div>
        {progress.streakWeeks > 0 && <Badge tone="ember"><Flame className="size-3" /> {progress.streakWeeks}-week streak</Badge>}
      </div>
      <OfflineWarmup sessionHref={today ? `/app/session/${today.id}` : null} images={[...(today ? [sessionArt(today.name, rec.profile.sex)] : []), ...(detail?.instances ?? []).map((i) => i.exercise.imageUrls[0]).filter((u): u is string => !!u)]} />
      <CoachPulse items={pulse} />
      {weekState && weekState.hasPrevious && !weekState.week.checkin && !weekState.week.isDeload ? <WeeklyCheckIn weekNumber={weekState.week.weekNumber} applied={weekState.week.adaptations} /> : null}
      {nudges.length ? <ul className="flex flex-wrap gap-2">{nudges.map((n) => (<li key={n.id} className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm ring-1 ring-white/[0.05] ${n.tone === "amber" ? "bg-amber-soft" : n.tone === "signal" ? "bg-signal-soft" : n.tone === "ember" ? "bg-ember-soft" : "bg-surface/60"}`}><span>{n.text}</span>{n.action ? <Link href={n.action.href} className="font-medium text-ember hover:underline">{n.action.label}</Link> : null}</li>))}</ul> : null}

      {!prog ? (
        <Card className="animate-fade-up"><CardContent className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display text-xl font-semibold">Profile ready. Let's build the block.</h2><p className="mt-1 text-sm text-fg-muted">{rec.aiSummary ?? "A periodised plan from your goals, schedule and equipment."}</p></div>
          <Button asChild size="lg"><Link href="/app/programme/new">Generate programme <Sparkles /></Link></Button>
        </CardContent></Card>
      ) : today ? (
        <HeroSession
          session={{ name: today.name, status: today.status, minutes: today.estimatedMinutes, focus: today.focus, label: today.status === "in_progress" ? "In progress" : (today as { isOverdue?: boolean }).isOverdue ? "Overdue" : (today as { isToday?: boolean }).isToday ? "Today" : new Date(today.scheduledOn).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) }}
          readiness={{ score: readiness.score, band: readiness.band, line: readiness.reasons[readiness.reasons.length - 1] ?? "" }}
          exercises={(detail?.instances ?? []).map((i) => { const w = i.plannedSets.filter((s) => s.type === "working"); const f = w[0]; const done = i.loggedSets.filter((l) => l.completed && w.some((x) => x.setNumber === l.setNumber)).length; return { id: i.id, name: i.exercise.name, role: i.role, sets: w.length, reps: f?.repRange ? `${f.repRange[0]}-${f.repRange[1]}` : String(f?.reps ?? ""), image: i.exercise.imageUrls[0], care: i.cautions.some((c) => c.level !== "info"), done, complete: w.length > 0 && done >= w.length }; })}
          live={today.status === "in_progress" && detail ? (() => { const inst = detail.instances; const per = inst.map((i) => { const w = i.plannedSets.filter((s) => s.type === "working"); return { total: w.length, done: i.loggedSets.filter((l) => l.completed && w.some((x) => x.setNumber === l.setNumber)).length, logs: i.loggedSets.filter((l) => l.completed) }; }); const setsTotal = per.reduce((a, x) => a + x.total, 0); const setsDone = per.reduce((a, x) => a + x.done, 0); const currentIndex = Math.max(0, per.findIndex((x) => x.done < x.total)); const last = per.flatMap((x) => x.logs).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0]; return { setsDone, setsTotal, currentIndex: currentIndex === -1 ? inst.length - 1 : currentIndex, elapsedMin: today.startedAt ? Math.max(0, Math.round((Date.now() - new Date(today.startedAt).getTime()) / 60000)) : 0, lastSet: last ? `${last.weightKg != null ? `${units === "metric" ? last.weightKg : Math.round(last.weightKg * 2.2046)} ${u} × ` : ""}${last.reps ?? "?"}${last.rpe ? ` @ RPE ${last.rpe}` : ""}` : null }; })() : null}
          week={{ done: progress.recentSessions.filter((s) => s.scheduledOn >= new Date(Date.now() - ((new Date().getDay() + 6) % 7) * 86400000).toISOString().slice(0, 10)).length, planned: prog?.daysPerWeek ?? 0 }}
          cta={today.status === "in_progress" ? "Continue" : "Start session"} href={`/app/session/${today.id}`} art={sessionArt(today.name, rec.profile.sex)}
        />
      ) : (
        <Card><CardContent className="flex items-center justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Block complete.</h2><p className="text-sm text-fg-muted">Time to build the next one.</p></div><Button asChild><Link href="/app/programme/new?continue=1">Build next block <ArrowRight /></Link></Button></CardContent></Card>
      )}

      <div className="grid grid-cols-2 divide-x divide-border rounded-2xl bg-surface/50 ring-1 ring-white/[0.04] lg:grid-cols-4">
        <Tile label="Sessions" value={progress.completedSessions} hint={prog ? `of ${prog.totalWeeks * prog.daysPerWeek}` : undefined} spark={progress.weeklyTonnage.map((x) => x.kg)} />
        <Tile label={`Volume · ${u}`} value={w(progress.tonnageThisWeek)} hint={progress.tonnageLastWeek && progress.tonnageThisWeek ? `${progress.tonnageThisWeek >= progress.tonnageLastWeek ? "+" : ""}${Math.round(((progress.tonnageThisWeek - progress.tonnageLastWeek) / progress.tonnageLastWeek) * 100)}% wk/wk` : progress.tonnageLastWeek ? `${w(progress.tonnageLastWeek)} last week` : "this week"} spark={progress.weeklyTonnage.map((x) => x.kg)} tone="sky" />
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
      <div><div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">{label}</div><div className="font-display mt-1 text-4xl font-semibold tracking-tightest"><CountUp value={value} /></div>{hint ? <div className="mt-0.5 text-xs text-fg-subtle">{hint}</div> : null}</div>
      {spark && spark.length > 1 ? <Sparkline points={spark} tone={tone} /> : null}
    </div>
  );
}

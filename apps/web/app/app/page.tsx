import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, Play, Sparkles } from "lucide-react";
import { Badge, Button, Card, CardContent, CoachPulse, CountUp, Ring, Sparkline, type PulseItem } from "@kettleworth/ui";
import { requireUser } from "@/lib/session";
import { getProfile, getActiveProgramme, todayState, sessionSummary, upcomingSessions, getReadiness, getProgress, ensureNutritionPlan, connectedProviders, activitiesForDay, getSessionDetail, hasUnreadLetter, listPhotos, runWeeklyAdaptation, currentWeekState, questBoard, diversifyProgramme } from "@kettleworth/api";
import { kgToLb, ritualNudges, loadModel, pastDayLabel } from "@kettleworth/core";
import { ActivityLog } from "@/components/today/activity-log";
import { sessionArt } from "@/lib/art";
import { OfflineWarmup } from "@/components/app/offline-warmup";
import { WeeklyCheckIn } from "@/components/today/check-in";
import { QuestBoard } from "@/components/today/quest-board";
import { DoneHero, whenLabel } from "@/components/app/day-hero";
import { SessionSheet, RestSheet } from "@/components/app/session-sheet";
import { localTodayIso, localTimeZone } from "@/lib/local-date";
import { AppStack } from "@/components/app/stack";

export const dynamic = "force-dynamic";

export default async function Today() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  await runWeeklyAdaptation(user.id).catch((e) => console.warn("weekly adaptation", e));
  const weekState = await currentWeekState(user.id);
  const [todayIso, tz] = await Promise.all([localTodayIso(), localTimeZone()]);
  // One-time pass that brings programmes built before week-to-week variety in line with it. Skips once done.
  await diversifyProgramme(user.id, todayIso).catch((e) => console.warn("diversify", e));
  const quests = await questBoard(user.id, todayIso, tz).catch(() => null);
  const [prog, state, upcoming, readiness, progress, nutrition, providers, activities] = await Promise.all([getActiveProgramme(user.id), todayState(user.id, todayIso, tz), upcomingSessions(user.id, 7, todayIso), getReadiness(user.id), getProgress(user.id), ensureNutritionPlan(user.id), connectedProviders(user.id), activitiesForDay(user.id)]);
  // Only a session you can actually do now gets the big start or continue card. A finished one is celebrated; tomorrow's is previewed.
  const today = state.kind === "in_progress" || state.kind === "today" || state.kind === "catch_up" ? state.session : null;
  const detail = today ? await getSessionDetail(user.id, today.id) : null;
  const doneSummary = state.kind === "done" ? await sessionSummary(user.id, state.session.id) : null;
  const [unread, photos] = await Promise.all([hasUnreadLetter(user.id), listPhotos(user.id)]);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const nudges = ritualNudges(rec.profile, { now: new Date(), weighedInToday: progress.measurements.some((m) => m.measuredOn === todayIso), photoThisWeek: photos.some((p) => p.takenOn >= weekAgo), sessionToday: state.kind === "today" || (state.kind === "in_progress" && state.session.scheduledOn === todayIso), sessionDone: state.kind === "done", letterUnread: unread });
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
    <AppStack>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><h1 className="font-display text-3xl tracking-tighter md:text-4xl">{greet}, {firstName}.</h1></div>
        {progress.streakWeeks > 0 && <Badge tone="amber"><Flame className="size-3" /> {progress.streakWeeks}-week streak</Badge>}
      </div>
      <OfflineWarmup sessionHref={today ? `/app/session/${today.id}` : null} images={[...(today ? [sessionArt(today.name, rec.profile.sex)] : []), ...(detail?.instances ?? []).map((i) => i.exercise.imageUrls[0]).filter((u): u is string => !!u)]} />
      <CoachPulse avatar="/art/seal.png" items={pulse} />
      {weekState && weekState.hasPrevious && !weekState.week.checkin && !weekState.week.isDeload ? <WeeklyCheckIn weekNumber={weekState.week.weekNumber} applied={weekState.week.adaptations} /> : null}
      {nudges.length ? <ul className="flex flex-wrap gap-2">{nudges.map((n) => (<li key={n.id} className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm ring-1 ring-border ${n.tone === "amber" ? "bg-amber-soft" : n.tone === "signal" ? "bg-signal-soft" : n.tone === "ember" ? "bg-ember-soft" : "bg-surface/60"}`}><span>{n.text}</span>{n.action ? <Link href={n.action.href} className="font-medium text-ember hover:underline">{n.action.label}</Link> : null}</li>))}</ul> : null}

      {!prog ? (
        <Card className="animate-fade-up"><CardContent className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display text-xl">Profile ready. Let's build the block.</h2><p className="mt-1 text-sm text-fg-muted">{rec.aiSummary ?? "A periodised plan from your goals, schedule and equipment."}</p></div>
          <Button asChild size="lg"><Link href="/app/programme/new">Generate programme <Sparkles /></Link></Button>
        </CardContent></Card>
      ) : today ? (
        <SessionSheet
          label={state.kind === "in_progress" ? (today.scheduledOn < todayIso ? `Started ${pastDayLabel(today.scheduledOn, todayIso)}` : "In progress") : state.kind === "catch_up" ? `Missed ${pastDayLabel(today.scheduledOn, todayIso)}` : "Today"}
          title={today.name}
          note={readiness.reasons[readiness.reasons.length - 1] ?? null}
          minutes={today.estimatedMinutes}
          focus={today.focus}
          rows={(detail?.instances ?? []).map((i) => {
            const work = i.plannedSets.filter((x) => x.type === "working");
            const f = work[0];
            return {
              id: i.id,
              name: i.exercise.name,
              detail: f?.repRange ? `${f.repRange[0]}–${f.repRange[1]} reps @ RPE ${f.targetRpe ?? "–"}` : f?.reps != null ? `${f.reps} reps` : "—",
              work: `${work.length} × ${f?.repRange ? `${f.repRange[0]}–${f.repRange[1]}` : f?.reps ?? "–"}`,
              load: f?.weightKg != null ? String(w(f.weightKg)) : "—",
              done: i.loggedSets.filter((l) => l.completed && work.some((x) => x.setNumber === l.setNumber)).length,
              total: work.length,
            };
          })}
          href={`/app/session/${today.id}`}
          cta={state.kind === "in_progress" ? "Continue" : state.kind === "catch_up" ? "Train it today" : "Start session"}
        />
      ) : state.kind === "done" ? (
        <DoneHero name={state.session.name} art={sessionArt(state.session.name, rec.profile.sex)} summary={doneSummary} next={state.next} todayIso={todayIso} unit={units === "metric" ? "kg" : "lb"} />
      ) : state.kind === "rest" ? (
        <RestSheet
          label="Today"
          next={state.next ? `${state.next.name} ${whenLabel(state.next.scheduledOn, todayIso)}` : null}
          href={state.next ? `/app/session/${state.next.id}` : null}
        />
      ) : (
        <Card><CardContent className="flex items-center justify-between gap-4"><div><h2 className="font-display text-xl">Block complete.</h2><p className="text-sm text-fg-muted">Time to build the next one.</p></div><Button asChild><Link href="/app/programme/new?continue=1">Build next block <ArrowRight /></Link></Button></CardContent></Card>
      )}

      {quests ? <QuestBoard board={quests} todayIso={todayIso} /> : null}
      <div className="grid grid-cols-2 border-t border-rule lg:grid-cols-4">
        <Tile label="Sessions" value={progress.completedSessions} hint={prog ? `of ${prog.totalWeeks * prog.daysPerWeek}` : undefined} spark={progress.weeklyTonnage.map((x) => x.kg)} />
        <Tile label={`Volume · ${u}`} value={w(progress.tonnageThisWeek)} hint={progress.tonnageLastWeek && progress.tonnageThisWeek ? `${progress.tonnageThisWeek >= progress.tonnageLastWeek ? "+" : ""}${Math.round(((progress.tonnageThisWeek - progress.tonnageLastWeek) / progress.tonnageLastWeek) * 100)}% wk/wk` : progress.tonnageLastWeek ? `${w(progress.tonnageLastWeek)} last week` : "this week"} spark={progress.weeklyTonnage.map((x) => x.kg)} tone="sky" />
        <Tile label="Calories" value={nutrition.targets.calories} hint={`${nutrition.targets.proteinG} g protein`} />
        <Tile label={`Weight · ${u}`} value={progress.measurements.at(-1)?.weightKg != null ? w(progress.measurements.at(-1)!.weightKg!) : 0} hint={progress.measurements.length > 1 ? `${progress.measurements.length} check-ins` : "log a weigh-in"} spark={progress.measurements.filter((m) => m.weightKg != null).map((m) => m.weightKg!)} tone="signal" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="font-display text-base">Week ahead</h3><Link href="/app/programme" className="text-xs text-ember hover:underline">Programme</Link></div>
          {upcoming.length ? (<ul className="grid gap-2 sm:grid-cols-2">{upcoming.slice(0, 4).map((s) => (<li key={s.id}><Link href={`/app/session/${s.id}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-border-strong hover:bg-surface-2"><span><span className="block font-medium">{s.name}</span><span className="text-xs text-fg-subtle">{whenLabel(s.scheduledOn, todayIso).replace(/^tomorrow$/, "Tomorrow")} · {s.estimatedMinutes} min</span></span><ArrowRight className="size-4 text-fg-subtle" /></Link></li>))}</ul>) : <p className="text-sm text-fg-muted">Generate a programme to fill your week.</p>}
        </CardContent></Card>
        <div className="space-y-3">
          <ActivityLog initial={activities} />
          {!providers.length && <Link href="/app/connected" className="block rounded-xl border border-dashed border-border-strong p-4 text-sm text-fg-muted transition-colors hover:border-ember hover:text-fg">Connect Whoop, Oura, Garmin, Fitbit, Polar or Strava and readiness calibrates itself every morning.</Link>}
        </div>
      </div>
    </AppStack>
  );
}

function Tile({ label, value, hint }: { label: string; value: number; hint?: string; spark?: number[]; tone?: "ember" | "signal" | "sky" | "amber" }) {
  return (
    <div className="border-b border-rule py-4 pr-4 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:pl-4 lg:first:pl-0">
      <div className="meta">{label}</div>
      <div className="font-display mt-1 text-3xl tabular"><CountUp value={value} /></div>
      {hint ? <div className="mt-0.5 text-xs text-fg-subtle">{hint}</div> : null}
    </div>
  );
}

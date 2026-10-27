import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Play, Sparkles } from "lucide-react";
import { Button, CoachPulse, Readout, ReadoutRow, type PulseItem } from "@kettleworth/ui";
import { requireUser } from "@/lib/session";
import { getProfile, getActiveProgramme, todayState, sessionSummary, upcomingSessions, getReadiness, getProgress, ensureNutritionPlan, connectedProviders, activitiesForDay, getSessionDetail, hasUnreadLetter, listPhotos, runWeeklyAdaptation, currentWeekState, questBoard, diversifyProgramme } from "@kettleworth/api";
import { kgToLb, ritualNudges, pastDayLabel } from "@kettleworth/core";
import { ActivityLog } from "@/components/today/activity-log";
import { sessionArt, ART, genderedArt } from "@/lib/art";
import { OfflineWarmup } from "@/components/app/offline-warmup";
import { WeeklyCheckIn } from "@/components/today/check-in";
import { QuestBoard } from "@/components/today/quest-board";
import { DonePanel, whenLabel } from "@/components/app/day-hero";
import { SessionSheet, RestSheet } from "@/components/app/session-sheet";
import { localTodayIso, localTimeZone } from "@/lib/local-date";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";
import { StickyAction } from "@/components/app/sticky-action";

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

  /*
   * The one number on this screen, from design/SECTION-MAP.md: load lifted this week. It is
   * the only figure that answers "is the work accumulating", which is the question a training
   * app exists to answer, and it is the number that makes a rest day feel earned rather than
   * empty. The accented second line is its only comparison.
   */
  const weekLoad = w(progress.tonnageThisWeek);
  const lastWeek = progress.tonnageLastWeek ? w(progress.tonnageLastWeek) : 0;
  const pct = lastWeek ? Math.round(((weekLoad - lastWeek) / lastWeek) * 100) : null;
  const second =
    pct != null
      ? `${pct >= 0 ? "+" : ""}${pct}% on last week.`
      : weekLoad > 0
        ? "First week on the board."
        : "Nothing lifted yet this week.";

  // The photograph: today's session when there is one, otherwise the week's own ground.
  const art = today ? sessionArt(today.name, rec.profile.sex) : state.kind === "done" ? genderedArt("progress", rec.profile.sex) : ART.programme;

  const startHref = today ? `/app/session/${today.id}` : null;
  const startLabel = state.kind === "in_progress" ? "Continue" : state.kind === "catch_up" ? "Train it today" : "Start session";

  return (
    <>
      <ScreenHero
        art={art}
        priority
        eyebrow={`${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${firstName}`}
        label="Load lifted this week"
        value={weekLoad}
        unit={u}
        second={second}
      />

      <Screen flush className={startHref || !prog ? "pt-10 pb-32" : "pt-10"}>

        <OfflineWarmup sessionHref={startHref} images={[...(today ? [art] : []), ...(detail?.instances ?? []).map((i) => i.exercise.imageUrls[0]).filter((x): x is string => !!x)]} />

        {/* The four numbers that support the one number. Nothing here is a card. */}
        <ReadoutRow>
          <Readout label="Readiness" value={readiness.score ?? "–"} note={readiness.score != null ? readiness.band : "connect a wearable"} accent={readiness.band === "high"} />
          <Readout label="Sessions" value={progress.completedSessions} note={prog ? `of ${prog.totalWeeks * prog.daysPerWeek}` : "no block yet"} />
          <Readout label="Streak" value={progress.streakWeeks} unit={progress.streakWeeks === 1 ? "week" : "weeks"} />
          <Readout label="Calories" value={nutrition.targets.calories} note={`${nutrition.targets.proteinG} g protein`} />
        </ReadoutRow>

        <CoachPulse avatar="/art/seal.png" items={pulse} />

        {weekState && weekState.hasPrevious && !weekState.week.checkin && !weekState.week.isDeload ? <WeeklyCheckIn weekNumber={weekState.week.weekNumber} applied={weekState.week.adaptations} /> : null}

        {nudges.length ? (
          <ul className="flex flex-wrap gap-2">
            {nudges.map((n) => (
              <li key={n.id} className="inline-flex items-center gap-2.5 rounded-full border border-rule px-4 py-2 text-sm text-fg-muted">
                <span>{n.text}</span>
                {n.action ? <Link href={n.action.href} className="text-fg transition-colors hover:text-volt">{n.action.label}</Link> : null}
              </li>
            ))}
          </ul>
        ) : null}

        {!prog ? (
          <section className="border-t border-rule pt-4">
            <p className="meta">No block yet</p>
            <h2 className="mt-1 font-display text-2xl">Profile ready. Let&apos;s build the block.</h2>
            <p className="measure mt-2 text-sm text-fg-muted">{rec.aiSummary ?? "A periodised plan from your goals, schedule and equipment."}</p>
          </section>
        ) : today ? (
          <SessionSheet
            label={state.kind === "in_progress" ? (today.scheduledOn < todayIso ? `Started ${pastDayLabel(today.scheduledOn, todayIso)}` : "In progress") : state.kind === "catch_up" ? `Missed ${pastDayLabel(today.scheduledOn, todayIso)}` : "Today"}
            title={today.name}
            note={readiness.reasons[readiness.reasons.length - 1] ?? null}
            minutes={today.estimatedMinutes}
            focus={today.focus.map((f) => f.replace(/_/g, " "))}
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
          />
        ) : state.kind === "done" ? (
          <DonePanel name={state.session.name} summary={doneSummary} next={state.next} todayIso={todayIso} unit={units === "metric" ? "kg" : "lb"} />
        ) : state.kind === "rest" ? (
          <RestSheet
            label="Today"
            next={state.next ? `${state.next.name} ${whenLabel(state.next.scheduledOn, todayIso)}` : null}
            href={state.next ? `/app/session/${state.next.id}` : null}
          />
        ) : (
          <section className="border-t border-rule pt-4">
            <p className="meta">Block complete</p>
            <h2 className="mt-1 font-display text-2xl">That block is finished.</h2>
            <p className="measure mt-2 text-sm text-fg-muted">Time to build the next one from where you are now.</p>
            <Button asChild className="mt-4"><Link href="/app/programme/new?continue=1">Build next block <ArrowRight /></Link></Button>
          </section>
        )}

        {quests ? <QuestBoard board={quests} todayIso={todayIso} /> : null}

        <section className="border-t border-rule pt-4">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-xl">Week ahead</h2>
            <Link href="/app/programme" className="meta transition-colors hover:text-fg">Programme</Link>
          </div>
          {upcoming.length ? (
            <ul className="grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
              {upcoming.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link href={`/app/session/${s.id}`} className="flex h-full items-center justify-between gap-3 bg-surface px-4 py-3.5 text-sm transition-colors hover:bg-bg">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg">{s.name}</span>
                      <span className="meta">{whenLabel(s.scheduledOn, todayIso).replace(/^tomorrow$/, "Tomorrow")} · {s.estimatedMinutes} min</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">Generate a programme to fill your week.</p>
          )}
        </section>

        <ActivityLog initial={activities} />

        {!providers.length ? (
          <Link href="/app/connected" className="measure block border-t border-rule pt-4 text-sm text-fg-muted transition-colors hover:text-fg">
            Connect Whoop, Oura, Garmin, Fitbit, Polar or Strava and readiness calibrates itself every morning.
          </Link>
        ) : null}
      </Screen>

      {/* Exactly one primary action per viewport, and on Today it is the session. */}
      {startHref ? (
        <StickyAction href={startHref} label={startLabel} note={today?.name} icon={<Play aria-hidden />} />
      ) : !prog ? (
        <StickyAction href="/app/programme/new" label="Generate programme" note="Built from your goals and equipment" icon={<Sparkles aria-hidden />} />
      ) : null}
    </>
  );
}

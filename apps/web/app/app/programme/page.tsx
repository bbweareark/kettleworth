import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfile, getProgrammeOverview, todayState, sessionsWithExercises } from "@kettleworth/api";
import { localTodayIso, localTimeZone } from "@/lib/local-date";
import { ThisWeek } from "@/components/programme/this-week";
import { Button, Progress, Readout, ReadoutRow } from "@kettleworth/ui";
import { VolumeChart } from "@/components/programme/volume-chart";
import { ProgrammeCalendar } from "@/components/programme/calendar";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";
import { Panel } from "@/components/app/panel";
import { ART } from "@/lib/art";

export const metadata = { title: "Programme" };
export const dynamic = "force-dynamic";

export default async function Programme() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [todayIso, tz] = await Promise.all([localTodayIso(), localTimeZone()]);
  // Settle today's plan first so sessions opened and abandoned without a set no longer read as in progress.
  const dayPlan = await todayState(user.id, todayIso, tz);
  const shift = (n: number) => new Date(new Date(`${todayIso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
  const dow = (new Date(`${todayIso}T12:00:00Z`).getUTCDay() + 6) % 7;
  const [o, weekSessions] = await Promise.all([getProgrammeOverview(user.id), sessionsWithExercises(user.id, shift(-dow), shift(6 - dow))]);
  const openMissedId = dayPlan.kind === "catch_up" ? dayPlan.session.id : dayPlan.kind === "rest" ? dayPlan.missed?.id ?? null : null;
  if (!o) redirect("/app/programme/new");
  const { programme: p, weeks, sessions, exercises, currentWeek, mesocycles } = o;
  const pct = o.totalSessions ? (o.completedSessions / o.totalSessions) * 100 : 0;
  const plan = p.plan;
  const block = mesocycles.find((m) => m.id === currentWeek?.mesocycleId)?.name ?? mesocycles[0]?.name ?? null;

  /*
   * The one number here, from design/SECTION-MAP.md: the week of the block. A periodised plan
   * only makes sense if you know where in it you are - which week it is decides whether a
   * heavy session is the plan working or the plan slipping. The accented line names the block
   * phase, which is the thing that number means.
   */
  const weekNo = currentWeek?.weekNumber ?? 1;

  return (
    <>
      <ScreenHero
        art={ART.programme}
        priority
        eyebrow={`Programme · ${p.name}`}
        label="Week of the block"
        value={weekNo}
        unit={`of ${p.totalWeeks}`}
        second={block ? `${block} phase.` : p.summary}
      />

      <Screen flush className="pt-10">

        <ReadoutRow className="border-t-0 pt-0">
          <Readout label="Sessions done" value={o.completedSessions} note={`of ${o.totalSessions}`} />
          <Readout label="Days a week" value={p.daysPerWeek} />
          <Readout label="Block" value={block ?? "–"} />
          <Readout label="Complete" value={Math.round(pct)} unit="%" accent={pct >= 100} />
        </ReadoutRow>

        <div>
          <Progress value={pct} className="h-1" label={`${Math.round(pct)}% of the block complete`} />
          <p className="measure mt-3 text-sm text-fg-muted">{p.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link href="/app/programme/new?continue=1">Extend: next block <Sparkles /></Link></Button>
            <Button asChild variant="ghost"><Link href="/app/programme/new">Start over</Link></Button>
          </div>
        </div>

        <ThisWeek sessions={weekSessions} todayIso={todayIso} openMissedId={openMissedId} />

        <Panel title="Whole block" note={`${p.totalWeeks} weeks, ${mesocycles.length} phase${mesocycles.length === 1 ? "" : "s"}.`}>
          <ProgrammeCalendar weeks={weeks} sessions={sessions} mesocycles={mesocycles} currentWeekId={currentWeek?.id ?? null} />
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Why this programme" note="Written when the block was built.">
            {p.coachNote ? <div className="prose-coach text-sm text-fg-muted">{p.coachNote.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}</div> : null}
            <ul className="mt-4 space-y-2 text-sm text-fg-muted">
              {p.rationale.map((r) => (
                <li key={r} className="flex gap-2.5"><span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-volt" />{r}</li>
              ))}
            </ul>
          </Panel>
          <Panel title="Weekly sets per muscle" note="What the block asks of each group every week.">
            <VolumeChart data={plan.weeklyVolumeBySet} />
          </Panel>
        </div>

        <details className="border-t border-rule pt-4">
          <summary className="cursor-pointer text-sm text-fg-muted transition-colors hover:text-fg">Exercise index ({Object.keys(exercises).length})</summary>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(exercises).sort((a, b) => a.name.localeCompare(b.name)).map((e) => (
              <li key={e.id} className="text-sm">
                <Link href={`/library/${e.slug}`} className="text-fg transition-colors hover:text-volt">{e.name}</Link>
                <span className="ml-2 text-xs capitalize text-fg-subtle">{e.primaryMuscles.map((m) => m.replace("_", " ")).join(", ")}</span>
              </li>
            ))}
          </ul>
        </details>
        </Screen>
    </>
  );
}

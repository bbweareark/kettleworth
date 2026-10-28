import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getProfile, getProgress, listPhotos, aiAvailable, physiqueProgress, liftsOverview } from "@kettleworth/api";
import { LiftsList } from "@/components/lifts/lifts-list";
import { dayMonth } from "@/lib/dates";
import { GrowthPanel, CompareSlider } from "@/components/progress/physique";
import { genderedArt } from "@/lib/art";
import { BodyCheck } from "@/components/progress/body-check";
import { MuscleGrid } from "@/components/muscle-figure";
import { Badge, Readout, ReadoutRow, EmptyState } from "@kettleworth/ui";
import { kgToLb, round } from "@kettleworth/core";
import { E1RMChart, TonnageChart, WeightChart, VolumeCompare, PhysiqueCharts } from "@/components/progress/charts-lazy";
import { MeasurementForm } from "@/components/progress/measurement-form";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";
import { Panel } from "@/components/app/panel";

export const metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function Progress() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const [p, photos, phys, lifts] = await Promise.all([getProgress(user.id), listPhotos(user.id), physiqueProgress(user.id), liftsOverview(user.id)]);
  const units = rec.profile.units;
  const w = (kg: number | null | undefined) => (kg == null ? null : units === "metric" ? round(kg, 1) : round(kgToLb(kg), 1));
  const u = units === "metric" ? "kg" : "lb";

  /*
   * The one number on this screen, from design/SECTION-MAP.md: the estimated max on the lift
   * in view. On the overview the lift in view is the one you are strongest on right now, which
   * is both the honest headline and the one a lifter wants to see first. The accented second
   * line is the movement on it since the block started - a max with no direction is trivia.
   */
  const tops = p.strength
    .map((s) => ({ name: s.name, first: s.series[0]?.e1rm ?? null, last: s.series[s.series.length - 1]?.e1rm ?? null }))
    .filter((x): x is { name: string; first: number | null; last: number } => x.last != null)
    .sort((a, b) => b.last - a.last);
  const top = tops[0] ?? null;
  const gain = top && top.first != null ? round((top.last - top.first) * (units === "metric" ? 1 : kgToLb(1)), 1) : null;
  const second = top
    ? gain == null || gain === 0
      ? "First read on this lift."
      : `${gain > 0 ? "+" : ""}${gain} ${u} since the block began.`
    : "Log a working set and the curve starts.";

  return (
    <>
      <ScreenHero
        art={genderedArt("progress", rec.profile.sex)}
        priority
        eyebrow={top ? `Progress · ${top.name}` : "Progress"}
        label={top ? `Estimated max · ${top.name}` : "Estimated max"}
        value={top ? w(top.last)! : "–"}
        unit={top ? u : undefined}
        decimals={1}
        second={second}
      />

      <Screen flush className="pt-10">

        <ReadoutRow>
          <Readout label="Sessions" value={p.completedSessions} />
          <Readout label="Week streak" value={p.streakWeeks} note={p.streakWeeks ? "alive" : "start one"} accent={p.streakWeeks > 0} />
          <Readout label="Volume this week" value={w(p.tonnageThisWeek) ?? 0} unit={u} note={p.tonnageLastWeek ? `${w(p.tonnageLastWeek)} last week` : undefined} />
          <Readout label="Personal records" value={p.prs.length} />
        </ReadoutRow>

        <GrowthPanel growth={phys.growth} />

        <section className="border-t border-rule pt-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-display text-xl">Every lift, and where it stands.</h2>
            <p className="measure meta">Last session, heaviest set and best estimated max. Tap one for its history.</p>
          </div>
          <LiftsList lifts={JSON.parse(JSON.stringify(lifts))} units={rec.profile.units} />
        </section>

        <section className="border-t border-rule pt-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-display text-xl">Where the work went.</h2>
            <p className="measure meta">Working sets per muscle group this week. Lit means trained.</p>
          </div>
          <MuscleGrid setsByMuscle={p.volumeThisWeek} lastWeek={p.volumeLastWeek} sex={rec.profile.sex ?? null} />
        </section>

        <section className="border-t border-rule pt-4">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-display text-xl">What the mirror can&apos;t measure.</h2>
            <p className="measure meta">Photo reads are smoothed against your weigh-ins, so a change in lighting never looks like a change in you.</p>
          </div>
          <div className={phys.compare ? "grid gap-8 lg:grid-cols-[minmax(0,390px)_1fr]" : ""}>
            {phys.compare ? <CompareSlider before={phys.compare.before} after={phys.compare.after} /> : null}
            <PhysiqueCharts timeline={phys.timeline} trends={phys.trends} unit={u} />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Strength trend" note="Estimated 1RM per week for your most-trained lifts.">
            {p.strength.length ? <E1RMChart series={p.strength.map((s) => ({ name: s.name, points: s.series.map((x) => ({ week: x.week, value: w(x.e1rm)! })) }))} unit={u} /> : <EmptyState title="No lifts logged yet" description="Log weights in the session player and trends appear here." />}
          </Panel>
          <Panel title="Weekly tonnage" note="Total weight lifted: sets × reps × load.">
            {p.weeklyTonnage.length ? <TonnageChart data={p.weeklyTonnage.map((x) => ({ week: x.week, kg: w(x.kg)! }))} unit={u} /> : <EmptyState title="Nothing yet" description="Complete a session to see volume." />}
          </Panel>
          <Panel title="Sets per muscle" note="This week against last week.">
            <VolumeCompare thisWeek={p.volumeThisWeek} lastWeek={p.volumeLastWeek} />
          </Panel>
          <Panel title="Bodyweight" note="Weigh in weekly, same time of day.">
            {p.measurements.filter((m) => m.weightKg != null).length ? <WeightChart data={p.measurements.filter((m) => m.weightKg != null).map((m) => ({ date: m.measuredOn, value: w(m.weightKg)! }))} unit={u} /> : <p className="text-sm text-fg-subtle">No weigh-ins yet.</p>}
            <MeasurementForm units={units} />
          </Panel>
        </div>

        <BodyCheck initial={photos.map((x) => ({ id: x.id, takenOn: x.takenOn, pose: x.pose, analysis: x.analysis ?? null }))} ai={aiAvailable()} priorityMuscles={rec.profile.priorityMuscles} sex={rec.profile.sex ?? "male"} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Personal records">
            {p.prs.length ? (
              <ul className="divide-y divide-rule">
                {p.prs.map((pr) => (
                  <li key={pr.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{pr.name}</span>
                    <span className="shrink-0 tabular text-fg-muted">{w(pr.weightKg)} {u} × {pr.reps} · e1RM {w(pr.value)} {u}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-subtle">Beat your best estimated 1RM on any lift and it lands here.</p>
            )}
          </Panel>
          <Panel title="Recent sessions">
            {p.recentSessions.length ? (
              <ul className="divide-y divide-rule">
                {p.recentSessions.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{s.name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-fg-muted">{s.sessionRpe ? <Badge tone="outline">RPE {s.sessionRpe}</Badge> : null}{dayMonth(s.scheduledOn)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-subtle">No sessions completed yet.</p>
            )}
          </Panel>
        </div>
        </Screen>
    </>
  );
}

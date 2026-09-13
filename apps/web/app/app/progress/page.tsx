import { redirect } from "next/navigation";
import { Flame, Trophy } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfile, getProgress } from "@kettleworth/api";
import { Badge, Card, CardContent, Stat, EmptyState } from "@kettleworth/ui";
import { kgToLb, round } from "@kettleworth/core";
import { E1RMChart, TonnageChart, WeightChart, VolumeCompare } from "@/components/progress/charts";
import { MeasurementForm } from "@/components/progress/measurement-form";

export const metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function Progress() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const p = await getProgress(user.id);
  const units = rec.profile.units;
  const w = (kg: number | null | undefined) => (kg == null ? null : units === "metric" ? round(kg, 1) : round(kgToLb(kg), 1));
  const u = units === "metric" ? "kg" : "lb";
  return (
    <div className="space-y-6">
      <div><p className="eyebrow">Progress</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">The numbers behind the work.</h1></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent><Stat label="Sessions completed" value={p.completedSessions} /></CardContent></Card>
        <Card><CardContent><Stat label="Week streak" value={p.streakWeeks} hint={p.streakWeeks ? "Keep it alive this week" : "Complete a session to start"} /></CardContent></Card>
        <Card><CardContent><Stat label="Volume this week" value={w(p.tonnageThisWeek) ?? 0} unit={u} delta={p.tonnageLastWeek ? `${w(p.tonnageLastWeek)} ${u} last week` : undefined} /></CardContent></Card>
        <Card><CardContent><Stat label="Personal records" value={p.prs.length} /></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent><h2 className="mb-1 font-display text-lg font-semibold">Strength trend</h2><p className="mb-3 text-xs text-fg-subtle">Estimated 1RM per week for your most-trained lifts.</p>{p.strength.length ? <E1RMChart series={p.strength.map((s) => ({ name: s.name, points: s.series.map((x) => ({ week: x.week, value: w(x.e1rm)! })) }))} unit={u} /> : <EmptyState title="No lifts logged yet" description="Log weights in the session player and trends appear here." />}</CardContent></Card>
        <Card><CardContent><h2 className="mb-1 font-display text-lg font-semibold">Weekly tonnage</h2><p className="mb-3 text-xs text-fg-subtle">Total weight lifted (sets × reps × load).</p>{p.weeklyTonnage.length ? <TonnageChart data={p.weeklyTonnage.map((x) => ({ week: x.week, kg: w(x.kg)! }))} unit={u} /> : <EmptyState title="Nothing yet" description="Complete a session to see volume." />}</CardContent></Card>
        <Card><CardContent><h2 className="mb-1 font-display text-lg font-semibold">Sets per muscle</h2><p className="mb-3 text-xs text-fg-subtle">This week vs last week.</p><VolumeCompare thisWeek={p.volumeThisWeek} lastWeek={p.volumeLastWeek} /></CardContent></Card>
        <Card><CardContent><h2 className="mb-1 font-display text-lg font-semibold">Bodyweight</h2><p className="mb-3 text-xs text-fg-subtle">Weigh in weekly, same time of day.</p>{p.measurements.filter((m) => m.weightKg != null).length ? <WeightChart data={p.measurements.filter((m) => m.weightKg != null).map((m) => ({ date: m.measuredOn, value: w(m.weightKg)! }))} unit={u} /> : <p className="text-sm text-fg-subtle">No weigh-ins yet.</p>}<MeasurementForm units={units} /></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Trophy className="size-4 text-ember" /> Personal records</h2>{p.prs.length ? <ul className="divide-y divide-border">{p.prs.map((pr) => <li key={pr.id} className="flex items-center justify-between py-2 text-sm"><span>{pr.name}</span><span className="tabular text-fg-muted">{w(pr.weightKg)} {u} × {pr.reps} · e1RM {w(pr.value)} {u}</span></li>)}</ul> : <p className="text-sm text-fg-subtle">Beat your best estimated 1RM on any lift and it lands here.</p>}</CardContent></Card>
        <Card><CardContent><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Flame className="size-4 text-ember" /> Recent sessions</h2>{p.recentSessions.length ? <ul className="divide-y divide-border">{p.recentSessions.map((s, i) => <li key={i} className="flex items-center justify-between py-2 text-sm"><span>{s.name}</span><span className="flex items-center gap-2 text-fg-muted">{s.sessionRpe ? <Badge tone="outline">RPE {s.sessionRpe}</Badge> : null}{new Date(s.scheduledOn).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></li>)}</ul> : <p className="text-sm text-fg-subtle">No sessions completed yet.</p>}</CardContent></Card>
      </div>
    </div>
  );
}

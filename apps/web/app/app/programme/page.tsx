import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, Clock, Sparkles, XCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfile, getProgrammeOverview } from "@kettleworth/api";
import { Badge, Button, Card, CardContent, Progress, cn } from "@kettleworth/ui";
import { VolumeChart } from "@/components/programme/volume-chart";
import { ProgrammeCalendar } from "@/components/programme/calendar";

export const metadata = { title: "Programme" };
export const dynamic = "force-dynamic";

export default async function Programme() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  if (!rec?.onboardingCompletedAt) redirect("/app/onboarding");
  const o = await getProgrammeOverview(user.id);
  if (!o) redirect("/app/programme/new");
  const { programme: p, weeks, sessions, exercises, currentWeek, mesocycles } = o;
  const pct = o.totalSessions ? (o.completedSessions / o.totalSessions) * 100 : 0;
  const byWeek = new Map(weeks.map((w) => [w.id, sessions.filter((s) => s.weekId === w.id)]));
  const plan = p.plan;
  return (
    <div className="space-y-6">
      <div className="relative -mx-4 -mt-6 overflow-hidden px-4 pb-8 pt-10 sm:-mx-6 sm:px-6 lg:-mt-8 lg:rounded-3xl lg:ring-1 lg:ring-white/[0.06]">
        <img src="/art/programme.jpg" alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover opacity-80" /><div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_80%,transparent)_50%,color-mix(in_oklch,var(--color-bg)_40%,transparent)_100%)]" /><div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_50%,var(--color-bg)_100%)]" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Programme</p><h1 className="font-display text-4xl font-semibold tracking-tightest md:text-5xl">{p.name}</h1><p className="mt-1 text-fg-muted">{p.summary}</p></div>
        <div className="flex gap-2"><Button asChild><Link href="/app/programme/new?continue=1">Extend: next block <Sparkles /></Link></Button><Button asChild variant="secondary"><Link href="/app/programme/new">Start over</Link></Button></div>
      </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-surface/50 ring-1 ring-white/[0.04]">
        <div className="p-4"><div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Done</div><div className="font-display mt-1 text-4xl font-semibold tabular tracking-tightest">{o.completedSessions}<span className="text-lg text-fg-subtle">/{o.totalSessions}</span></div></div>
        <div className="p-4"><div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Week</div><div className="font-display mt-1 text-4xl font-semibold tabular tracking-tightest">{currentWeek?.weekNumber ?? 1}<span className="text-lg text-fg-subtle">/{p.totalWeeks}</span></div></div>
        <div className="p-4"><div className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">Block</div><div className="font-display mt-1 truncate text-2xl font-semibold tracking-tighter">{mesocycles.find((m) => m.id === currentWeek?.mesocycleId)?.name ?? mesocycles[0]?.name}</div></div>
      </div>
      <Progress value={pct} className="h-1" />
      <section className="rounded-3xl bg-surface/40 p-5 ring-1 ring-white/[0.04]">
        <ProgrammeCalendar weeks={weeks} sessions={sessions} mesocycles={mesocycles} currentWeekId={currentWeek?.id ?? null} />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <details className="rounded-2xl bg-surface/40 p-5 ring-1 ring-white/[0.04]"><summary className="cursor-pointer font-display text-base font-semibold">Coach note</summary>{p.coachNote ? <div className="prose-coach mt-3 text-sm text-fg-muted">{p.coachNote.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}</div> : null}<h4 className="mt-4 text-2xs uppercase tracking-[0.16em] text-fg-subtle">Why this programme</h4><ul className="mt-2 space-y-1.5 text-sm text-fg-muted">{p.rationale.map((r) => <li key={r} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{r}</li>)}</ul></details>
        <div className="rounded-2xl bg-surface/40 p-5 ring-1 ring-white/[0.04]"><h3 className="mb-3 font-display text-base font-semibold">Weekly sets per muscle</h3><VolumeChart data={plan.weeklyVolumeBySet} /></div>
      </div>
      <details><summary className="cursor-pointer text-sm font-medium text-fg-muted">Exercise index ({Object.keys(exercises).length})</summary><ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.values(exercises).sort((a, b) => a.name.localeCompare(b.name)).map((e) => <li key={e.id}><Link href={`/library/${e.slug}`} className="text-sm text-ember hover:underline">{e.name}</Link><span className="ml-2 text-xs text-fg-subtle capitalize">{e.primaryMuscles.map((m) => m.replace("_", " ")).join(", ")}</span></li>)}</ul></details>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, Clock, Sparkles, XCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProfile, getProgrammeOverview } from "@kettleworth/api";
import { Badge, Button, Card, CardContent, Progress, cn } from "@kettleworth/ui";
import { VolumeChart } from "@/components/programme/volume-chart";

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Programme</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{p.name}</h1><p className="mt-1 text-fg-muted">{p.summary}</p></div>
        <Button asChild variant="secondary"><Link href="/app/programme/new">Regenerate <Sparkles /></Link></Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm"><span className="font-medium">{o.completedSessions} of {o.totalSessions} sessions</span><span className="text-fg-subtle">Started {new Date(p.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div>
          <Progress value={pct} />
          {p.coachNote ? <div className="prose-coach rounded-lg bg-surface-2 p-4 text-sm text-fg-muted">{p.coachNote.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}</div> : null}
          <details className="group"><summary className="cursor-pointer text-sm font-medium text-ember">Why this programme?</summary><ul className="mt-2 space-y-1.5 text-sm text-fg-muted">{p.rationale.map((r) => <li key={r} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{r}</li>)}</ul></details>
        </CardContent></Card>
        <Card><CardContent><h3 className="mb-3 font-display text-lg font-semibold">Weekly sets per muscle</h3><VolumeChart data={plan.weeklyVolumeBySet} /></CardContent></Card>
      </div>
      <div className="space-y-6">
        {mesocycles.map((m) => (
          <section key={m.id} className="space-y-3">
            <div className="flex items-baseline gap-3"><h2 className="font-display text-xl font-semibold">{m.name}</h2><span className="text-sm text-fg-muted">{m.focus}</span></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {weeks.filter((w) => w.mesocycleId === m.id).map((w) => {
                const ws = byWeek.get(w.id) ?? [];
                const isCurrent = currentWeek?.id === w.id;
                return (
                  <Card key={w.id} className={cn(isCurrent && "border-ember shadow-glow")}><CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between"><span className="font-medium">Week {w.weekNumber}</span><div className="flex gap-1">{w.isDeload && <Badge tone="amber">Deload</Badge>}{isCurrent && <Badge tone="ember">Now</Badge>}</div></div>
                    <div className="text-2xs text-fg-subtle">Vol ×{w.volumeScalar} · Int ×{w.intensityScalar}</div>
                    <ul className="space-y-1">{ws.map((s) => (<li key={s.id}><Link href={`/app/session/${s.id}`} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-surface-2">{s.status === "completed" ? <CheckCircle2 className="size-4 text-signal" /> : s.status === "skipped" ? <XCircle className="size-4 text-fg-subtle" /> : s.status === "in_progress" ? <Clock className="size-4 text-ember" /> : <Circle className="size-4 text-fg-subtle" />}<span className="flex-1 truncate">{s.name}</span><span className="text-2xs text-fg-subtle">{new Date(s.scheduledOn).toLocaleDateString("en-GB", { weekday: "short" })}</span></Link></li>))}</ul>
                  </CardContent></Card>);
              })}
            </div>
          </section>
        ))}
      </div>
      <details><summary className="cursor-pointer text-sm font-medium text-fg-muted">Exercise index ({Object.keys(exercises).length})</summary><ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.values(exercises).sort((a, b) => a.name.localeCompare(b.name)).map((e) => <li key={e.id}><Link href={`/library/${e.slug}`} className="text-sm text-ember hover:underline">{e.name}</Link><span className="ml-2 text-xs text-fg-subtle capitalize">{e.primaryMuscles.map((m) => m.replace("_", " ")).join(", ")}</span></li>)}</ul></details>
    </div>
  );
}

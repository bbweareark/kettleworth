import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Lightbulb, XCircle, ShieldAlert } from "lucide-react";
import { getExercise } from "@kettleworth/api";
import { Badge, Card, CardContent } from "@kettleworth/ui";
import { ExerciseMedia } from "@/components/library/media";

const label = (s: string) => s.replace(/_/g, " ");
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const e = await getExercise((await params).slug); return { title: e?.name ?? "Exercise" }; }
export const revalidate = 300;

export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getExercise((await params).slug);
  if (!e) notFound();
  const video = e.videos.find((v) => !v.isPlaceholder && v.status === "ready") ?? e.videos[0] ?? null;
  return (
    <article className="space-y-6">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Library</Link>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <ExerciseMedia name={e.name} images={e.imageUrls} video={video ? { provider: video.provider, playbackId: video.playbackId, isPlaceholder: video.isPlaceholder, status: video.status } : null} />
        <div className="space-y-5">
          <div><div className="mb-2 flex flex-wrap gap-1.5"><Badge tone="ember" className="capitalize">{label(e.pattern)}</Badge><Badge tone="outline" className="capitalize">{e.difficulty}</Badge><Badge tone="outline" className="capitalize">{e.mechanics}</Badge>{e.unilateral && <Badge tone="outline">Unilateral</Badge>}</div><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{e.name}</h1>{e.aliases.length ? <p className="mt-1 text-sm text-fg-subtle">Also called {e.aliases.join(", ")}</p> : null}</div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="eyebrow mb-1">Primary</dt><dd className="capitalize">{e.primaryMuscles.map(label).join(", ") || "-"}</dd></div>
            <div><dt className="eyebrow mb-1">Secondary</dt><dd className="capitalize">{e.secondaryMuscles.map(label).join(", ") || "-"}</dd></div>
            <div><dt className="eyebrow mb-1">Equipment</dt><dd className="capitalize">{e.equipment.map(label).join(", ")}</dd></div>
            <div><dt className="eyebrow mb-1">Watch out for</dt><dd className="capitalize">{e.contraindicatedRegions.map(label).join(", ") || "-"}</dd></div>
          </dl>
          {e.cues.length ? <Card><CardContent className="space-y-2"><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Lightbulb className="size-4 text-ember" /> Coaching cues</h2><ul className="space-y-1.5 text-sm text-fg-muted">{e.cues.map((c) => <li key={c} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ember" />{c}</li>)}</ul></CardContent></Card> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1"><CardContent><h2 className="mb-2 font-display text-lg font-semibold">How to do it</h2><ol className="list-decimal space-y-2 pl-5 text-sm text-fg-muted">{e.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol></CardContent></Card>
        <Card><CardContent><h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold"><XCircle className="size-4 text-rose" /> Common mistakes</h2>{e.commonMistakes.length ? <ul className="space-y-1.5 text-sm text-fg-muted">{e.commonMistakes.map((c) => <li key={c}>{c}</li>)}</ul> : <p className="text-sm text-fg-subtle">Coaching notes for this movement are coming.</p>}</CardContent></Card>
        <Card><CardContent><h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold"><ShieldAlert className="size-4 text-amber" /> Safety</h2>{e.safetyNotes.length ? <ul className="space-y-1.5 text-sm text-fg-muted">{e.safetyNotes.map((c) => <li key={c}>{c}</li>)}</ul> : <p className="text-sm text-fg-subtle">Move with control, stop on sharp pain, and start lighter than you think.</p>}{e.variations.length ? <><h3 className="mt-4 eyebrow">Variations</h3><p className="mt-1 text-sm text-fg-muted">{e.variations.join(" · ")}</p></> : null}</CardContent></Card>
      </div>
      <p className="flex items-center gap-2 text-xs text-fg-subtle"><AlertTriangle className="size-3.5" /> {video && !video.isPlaceholder ? `Video: ${video.license}. ` : ""}Stills: {e.source} ({e.sourceLicense}).</p>
    </article>
  );
}

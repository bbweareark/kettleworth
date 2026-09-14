import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";
import { Badge, Ring, CountUp } from "@kettleworth/ui";

type Ex = { id: string; name: string; sets: number; reps: string; role: string; image?: string; care?: boolean };
/**
 * Today's session as an instrument, not a card: a darkened still from the first lift as the ground, the readiness ring
 * as the dial, and a session map (numerals, not sentences) for what's ahead.
 */
export function HeroSession({ session, readiness, exercises, cta, href, art }: { session: { name: string; label: string; minutes: number; focus: string[]; status: string }; readiness: { score: number | null; band: string; line: string }; exercises: Ex[]; cta: string; href: string; art?: string }) {
  const bg = art ?? exercises.find((e) => e.image)?.image;
  const tone = readiness.band === "high" ? "signal" : readiness.band === "moderate" ? "amber" : readiness.band === "low" ? "rose" : "sky";
  return (
    <section className="relative overflow-hidden rounded-3xl ring-1 ring-white/[0.06]" aria-label="Today's session">
      {bg ? <img src={bg} alt="" aria-hidden className={art ? "absolute inset-0 size-full object-cover opacity-90" : "absolute inset-0 size-full object-cover object-top opacity-[0.28] grayscale"} /> : null}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_82%,transparent)_45%,color-mix(in_oklch,var(--color-bg)_35%,transparent)_100%)]" /><div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--color-bg)_100%)]" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_30%,color-mix(in_oklch,var(--color-ember)_14%,transparent),transparent_70%)]" />
      <div className="relative grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-2"><Badge tone={session.status === "in_progress" ? "signal" : "ember"}>{session.label}</Badge><span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">{session.minutes} min · {session.focus.slice(0, 3).map((m) => m.replace("_", " ")).join(" · ")}</span></div>
          <h2 className="font-display text-5xl font-semibold leading-[0.95] tracking-tightest md:text-6xl">{session.name}</h2>
          {readiness.score != null ? <p className="mt-3 max-w-md text-sm text-fg-muted">{readiness.line}</p> : null}
          <ol className="mt-6 flex gap-5 overflow-x-auto pb-2 scrollbar-none" aria-label="Session map">
            {exercises.map((e, i) => (
              <li key={e.id} className="flex shrink-0 flex-col gap-1 border-l border-white/10 pl-3 first:border-0 first:pl-0">
                <span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">{String(i + 1).padStart(2, "0")}{e.care ? " · care" : ""}</span>
                <span className="font-display text-2xl font-semibold tabular tracking-tighter">{e.sets}<span className="text-fg-subtle">×</span>{e.reps}</span>
                <span className="max-w-[9rem] truncate text-xs text-fg-muted">{e.name}</span>
              </li>))}
          </ol>
          <div className="mt-6 flex items-center gap-3"><Link href={href} className="inline-flex h-12 items-center gap-2 rounded-lg bg-fg px-6 text-base font-semibold text-bg transition-transform hover:scale-[1.02] active:scale-[0.98]">{cta} <Play className="size-4" /></Link><Link href="/app/programme" className="inline-flex h-12 items-center gap-1 px-3 text-sm text-fg-muted hover:text-fg">This week <ChevronRight className="size-4" /></Link></div>
        </div>
        <Ring value={readiness.score != null ? readiness.score / 100 : 0} size={168} stroke={10} tone={tone} label={`Readiness ${readiness.score ?? "unknown"}`}>
          <div className="text-center"><div className="font-display text-5xl font-semibold tracking-tightest">{readiness.score != null ? <CountUp value={readiness.score} /> : "–"}</div><div className="text-2xs uppercase tracking-[0.2em] text-fg-subtle">Readiness</div></div>
        </Ring>
      </div>
    </section>
  );
}

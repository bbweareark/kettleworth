import Link from "next/link";
import { Play, ChevronRight, Check } from "lucide-react";
import { Ring, CountUp, cn } from "@kettleworth/ui";

type Ex = { id: string; name: string; sets: number; reps: string; role: string; image?: string; care?: boolean; done?: number; complete?: boolean };
type Live = { setsDone: number; setsTotal: number; currentIndex: number; elapsedMin: number; lastSet: string | null };
type Dial = { kind: "session"; value: number; big: string; label: string } | { kind: "readiness"; value: number; big: string; label: string; band: string } | { kind: "week"; value: number; big: string; label: string };

/**
 * Today's session as an instrument. The dial shows the most useful number right now: sets done while training,
 * readiness when there's a recovery signal, otherwise the week. The session map marks done, current and upcoming.
 */
export function HeroSession({ session, readiness, exercises, cta, href, art, live, week }: { session: { name: string; label: string; minutes: number; focus: string[]; status: string }; readiness: { score: number | null; band: string; line: string }; exercises: Ex[]; cta: string; href: string; art?: string; live?: Live | null; week?: { done: number; planned: number } }) {
  const bg = art ?? exercises.find((e) => e.image)?.image;
  const dial: Dial = live ? { kind: "session", value: live.setsTotal ? live.setsDone / live.setsTotal : 0, big: `${live.setsDone}`, label: `of ${live.setsTotal} sets` }
    : readiness.score != null ? { kind: "readiness", value: readiness.score / 100, big: String(readiness.score), label: "readiness", band: readiness.band }
    : { kind: "week", value: week && week.planned ? week.done / week.planned : 0, big: `${week?.done ?? 0}`, label: `of ${week?.planned ?? 0} this week` };
  const tone = dial.kind === "readiness" ? (dial.band === "high" ? "signal" : dial.band === "moderate" ? "amber" : "rose") : dial.kind === "session" ? "ember" : "sky";
  const current = live ? exercises[live.currentIndex] : null;
  return (
    <section className="relative overflow-hidden rounded-3xl ring-1 ring-white/[0.06]" aria-label="Today's session">
      {bg ? <img src={bg} alt="" aria-hidden className={art ? "absolute inset-0 size-full object-cover opacity-90" : "absolute inset-0 size-full object-cover object-top opacity-[0.28] grayscale"} /> : null}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_82%,transparent)_45%,color-mix(in_oklch,var(--color-bg)_35%,transparent)_100%)]" /><div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--color-bg)_100%)]" />
      {live ? <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-white/10"><div className="h-full bg-ember transition-[width] duration-700" style={{ width: `${dial.value * 100}%` }} /></div> : null}
      <div className="relative grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-2xs uppercase tracking-[0.16em] text-fg-subtle">
              {live ? <span className={live.elapsedMin <= 180 ? "text-signal" : "text-amber"}>{live.elapsedMin <= 180 ? `In session · ${live.elapsedMin} min` : `Paused · ${live.setsDone} of ${live.setsTotal} sets done`}</span> : <span className="text-ember">{session.label}</span>}
              <span className="mx-2 opacity-40">|</span>{session.minutes} min · {session.focus.slice(0, 3).map((m) => m.replace("_", " ")).join(" · ")}
            </span>
          </div>
          <h2 className="font-display text-5xl font-semibold leading-[0.95] tracking-tightest md:text-6xl">{session.name}</h2>
          {live && current ? <p className="mt-3 text-sm text-fg-muted"><span className="text-fg">Now:</span> {current.name}, set {Math.min((current.done ?? 0) + 1, current.sets)} of {current.sets}.{live.lastSet ? ` Last set ${live.lastSet}.` : ""}</p> : readiness.score != null ? <p className="mt-3 max-w-md text-sm text-fg-muted">{readiness.line}</p> : null}
          <ol className="mt-6 flex gap-5 overflow-x-auto pb-2 scrollbar-none" aria-label="Session map">
            {exercises.map((e, i) => { const isCur = live && i === live.currentIndex; const isDone = !!e.complete; return (
              <li key={e.id} className={cn("flex shrink-0 flex-col gap-1 border-l border-white/10 pl-3 first:border-0 first:pl-0 transition-opacity", isDone && "opacity-45")}>
                <span className={cn("flex items-center gap-1 text-2xs uppercase tracking-[0.16em]", isCur ? "text-ember" : "text-fg-subtle")}>{isDone ? <Check className="size-3 text-signal" /> : null}{isCur ? "now" : String(i + 1).padStart(2, "0")}{e.care ? " · care" : ""}</span>
                <span className={cn("font-display text-2xl font-semibold tabular tracking-tighter", isCur && "text-fg")}>{live && !isDone ? <>{e.done ?? 0}<span className="text-fg-subtle">/</span>{e.sets}</> : <>{e.sets}<span className="text-fg-subtle">×</span>{e.reps}</>}</span>
                <span className={cn("max-w-[9rem] truncate text-xs", isCur ? "text-fg" : "text-fg-muted")}>{e.name}</span>
                {isCur ? <span className="h-0.5 w-8 rounded-full bg-ember" /> : null}
              </li>); })}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2"><Link href={href} className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-lg bg-fg px-6 text-base font-semibold text-bg transition-transform hover:scale-[1.02] active:scale-[0.98]">{cta} <Play className="size-4" /></Link><Link href="/app/programme" className="inline-flex h-12 items-center gap-1 whitespace-nowrap px-3 text-sm text-fg-muted hover:text-fg">Week plan <ChevronRight className="size-4" /></Link></div>
        </div>
        <Ring value={dial.value} size={168} stroke={10} tone={tone} label={`${dial.label} ${dial.big}`}>
          <div className="text-center"><div className="font-display text-5xl font-semibold tracking-tightest"><CountUp value={Number(dial.big)} /></div><div className="mx-auto max-w-[7rem] text-2xs uppercase tracking-[0.18em] text-fg-subtle">{dial.label}</div></div>
        </Ring>
      </div>
    </section>
  );
}

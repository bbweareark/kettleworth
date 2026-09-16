import Link from "next/link";
import { Check, ChevronRight, Moon, Trophy } from "lucide-react";

type Next = { id: string; name: string; scheduledOn: string; estimatedMinutes: number } | null;
const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** "tomorrow", "Thursday" or "Thu 25 Sep", computed from calendar dates only, so the server and the phone agree. */
export function whenLabel(dateIso: string, todayIso: string): string {
  const d = new Date(`${dateIso}T12:00:00Z`), t = new Date(`${todayIso}T12:00:00Z`);
  const days = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (days === 1) return "tomorrow";
  if (days > 1 && days < 7) return WEEKDAY[d.getUTCDay()]!;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${WEEKDAY[d.getUTCDay()]!.slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function UpNext({ next, todayIso, train }: { next: Next; todayIso: string; train?: boolean }) {
  if (!next) return <p className="text-sm text-white/70">That was the last session of this block.</p>;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link href={`/app/session/${next.id}`} className="group inline-flex items-center gap-3 rounded-2xl bg-black/35 px-4 py-3 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/50">
        <span><span className="block text-2xs uppercase tracking-[0.16em] text-white/60">Up next · {whenLabel(next.scheduledOn, todayIso)}</span><span className="block font-display text-lg font-semibold tracking-tight text-white">{next.name}</span></span>
        <span className="inline-flex items-center gap-1 text-sm text-white/70 group-hover:text-white">Preview <ChevronRight className="size-4" /></span>
      </Link>
      {train ? <Link href={`/app/session/${next.id}?start=1`} className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">Train today instead</Link> : null}
    </div>
  );
}

/** Today's session is finished: say so, show what it added up to, and only preview what comes next. */
export function DoneHero({ name, art, summary, next, todayIso, unit }: { name: string; art: string; summary: { sets: number; volumeKg: number; minutes: number | null; records: number } | null; next: Next; todayIso: string; unit: "kg" | "lb" }) {
  const vol = summary ? (unit === "kg" ? summary.volumeKg : Math.round(summary.volumeKg * 2.20462)) : 0;
  return (
    <section className="relative overflow-hidden rounded-3xl ring-1 ring-white/[0.06]" aria-label="Today's session is done">
      <img src={art} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-60 grayscale-[35%]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_80%,transparent)_55%,color-mix(in_oklch,var(--color-bg)_45%,transparent)_100%)]" />
      <div className="relative space-y-6 p-6 md:p-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-[0.16em] text-signal"><Check className="size-3.5" /> Done for today</span>
          <h2 className="mt-2 font-display text-4xl font-semibold leading-[0.95] tracking-tightest md:text-5xl">{name}, done.</h2>
          <p className="mt-2 max-w-md text-sm text-fg-muted">The work is in. Eat, sleep, and let it turn into strength.</p>
        </div>
        {summary ? (
          <dl className="grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Sets", String(summary.sets)], [`Volume · ${unit}`, vol.toLocaleString("en-GB")], ["Minutes", summary.minutes != null ? String(summary.minutes) : "-"], ["Records", String(summary.records)]].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-black/30 px-3 py-2.5 ring-1 ring-white/[0.06]"><dt className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">{l}</dt><dd className="mt-0.5 flex items-center gap-1.5 font-display text-2xl font-semibold tabular tracking-tight">{l === "Records" && summary.records > 0 ? <Trophy className="size-4 text-ember" /> : null}{v}</dd></div>
            ))}
          </dl>
        ) : null}
        <UpNext next={next} todayIso={todayIso} />
      </div>
    </section>
  );
}

/** Nothing scheduled today: rest is part of the plan, and the next session is one tap away if the day allows. */
export function RestHero({ art, next, todayIso }: { art: string; next: NonNullable<Next>; todayIso: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl ring-1 ring-white/[0.06]" aria-label="Rest day">
      <img src={art} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-50 grayscale-[45%]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_82%,transparent)_55%,color-mix(in_oklch,var(--color-bg)_50%,transparent)_100%)]" />
      <div className="relative space-y-6 p-6 md:p-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-[0.16em] text-sky"><Moon className="size-3.5" /> Rest day</span>
          <h2 className="mt-2 font-display text-4xl font-semibold leading-[0.95] tracking-tightest md:text-5xl">Recover on purpose.</h2>
          <p className="mt-2 max-w-md text-sm text-fg-muted">Muscle is built between sessions. A walk, good food and early sleep are today's training.</p>
        </div>
        <UpNext next={next} todayIso={todayIso} train />
      </div>
    </section>
  );
}

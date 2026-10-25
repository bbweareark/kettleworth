import Link from "next/link";
import { Button } from "@kettleworth/ui";
import { WeekTable } from "@/components/marketing/week-table";
import { Conveyor } from "@/components/marketing/conveyor";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/*
 * Built against design/SECTION-MAP.md. The reference (teenage.engineering) measures zero
 * cards, zero radius, zero shadows, zero gradients and one inverted band, so this page has
 * the same. Sections vary their container deliberately: full-bleed table, contained conveyor,
 * ruled index, full-bleed band, contained close.
 */
const METHOD = [
  {
    n: "01",
    h: "It reads the set you just logged",
    b: "Reps above the target and the effort low? The next set goes up. Three reps short, or the effort at 9.5? It comes down. The decision is arithmetic, and it shows you the arithmetic.",
  },
  {
    n: "02",
    h: "The deload is written in from the start",
    b: "Three weeks up, one week back, then higher than before. Blocks are eight to twelve weeks, and the easy week is the reason the hard weeks keep working.",
  },
  {
    n: "03",
    h: "Accessories rotate, the main lifts do not",
    b: "Week A and week B swap the accessory work so you are not doing the same six movements for three months. Squat, bench, deadlift and row stay put, because that is what progress is measured against.",
  },
  {
    n: "04",
    h: "A bad night changes today, not the plan",
    b: "Connect a wearable and poor sleep eases today's loads by a measured percentage. The block underneath is untouched.",
  },
];

export default async function Landing() {
  const session = await getSession();
  const cta = session ? { href: "/app", label: "Open app" } : { href: "/sign-up", label: "Start free" };

  return (
    <main>
      {/* 1 — Table hero. The week is the headline. */}
      <section id="week" className="mx-auto w-full max-w-[1200px] px-4 pb-section pt-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
          <div>
            <p className="meta">Week 5 of 9 · build</p>
            <h1 className="mt-3 font-display text-hero">
              This is the week.
              <br />
              Nothing else is.
            </h1>
            <p className="measure mt-5 text-base text-fg-muted">
              Kettleworth writes the block, reads every set you log, and moves tomorrow's
              numbers before you get there. One sheet. No guessing what to do next.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg"><Link href={cta.href}>{cta.label}</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/library">Browse 850 movements</Link></Button>
            </div>
            <p className="mt-4 text-xs text-fg-subtle">No card. Two minutes to a first block.</p>
          </div>

          <WeekTable />
        </div>
      </section>

      {/* 2 — The conveyor: the one thing on the page that moves. */}
      <section id="block" className="border-y border-rule bg-surface-2/40">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-section sm:px-6">
          <Conveyor />
        </div>
      </section>

      {/* 3 — Method as a numbered editorial index. Type and rules, no cards. */}
      <section id="method" className="mx-auto w-full max-w-[1200px] px-4 py-section sm:px-6">
        <h2 className="meta mb-8">How it decides</h2>
        <div>
          {METHOD.map((m) => (
            <article key={m.n} className="grid gap-x-8 gap-y-2 border-t border-rule py-7 sm:grid-cols-[4rem_minmax(0,20rem)_minmax(0,1fr)]">
              <p className="font-display text-2xl text-fg-subtle tabular">{m.n}</p>
              <h3 className="font-display text-xl">{m.h}</h3>
              <p className="measure text-base text-fg-muted">{m.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 4 — The one inverted band, acting as a display-case wall. */}
      <section className="band">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-section sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
          <p className="font-display text-3xl leading-[1.12]">
            Hit every rep and the bar goes up. Sleep badly and today eases off.
            Nothing happens silently, and nothing happens for a reason you cannot read.
          </p>
          <img
            src="/art/grip.jpg"
            alt="Chalked hands gripping a loaded barbell"
            width={900}
            height={900}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full object-cover"
          />
        </div>
      </section>

      {/* 5 — Close. Same button pair, same sizes. */}
      <section className="mx-auto w-full max-w-[1200px] px-4 py-section sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h2 className="font-display text-3xl">Twenty questions, then an eight-week block.</h2>
            <p className="measure mt-4 text-base text-fg-muted">
              Answer them once. The block is written around your body, your kit and the days
              you can actually train, and it keeps moving after that.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg"><Link href={cta.href}>{cta.label}</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/library">See the library</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}

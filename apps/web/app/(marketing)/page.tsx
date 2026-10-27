import Link from "next/link";
import { Button, Figure, Readout } from "@kettleworth/ui";
import { WeekTable } from "@/components/marketing/week-table";
import { Conveyor } from "@/components/marketing/conveyor";
import { Unmask } from "@/components/motion/unmask";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/*
 * Built against design/SECTION-MAP.md for the Integrated Biosciences revamp.
 *
 * The hero is ported from Lando Norris: a photograph bleeding edge to edge with the figure
 * carried on the ground directly beneath it, never set over the image. The page then alternates
 * its container on purpose - full-bleed photograph, contained table, full-width conveyor, ruled
 * index, full-bleed image band, contained close - so no two sections have the same shape.
 *
 * It replaces a page built against teenage.engineering, which opened on a table. A table is a
 * fine hero for a catalogue of synthesisers; for a training app the first thing on the screen
 * should be the thing the product is about, which is load.
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
      {/* 1 — Full-bleed photograph, the figure beneath it. */}
      <section aria-label="Your first block">
        <div className="relative w-full overflow-hidden">
          <Unmask src="/art/landing.jpg" priority className="aspect-[5/4] w-full object-cover sm:aspect-[16/9] lg:aspect-[2.4/1]" />
          <div aria-hidden className="scrim absolute inset-0" />
          <p className="meta absolute inset-x-0 bottom-3 mx-auto max-w-[1200px] px-4 sm:px-6">Adaptive strength training</p>
        </div>
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <Figure labelAs="h1" label="Your first block" value={8} unit="weeks" className="pt-4" />
          <p className="mt-2 font-display text-xl text-volt">Written in about two minutes.</p>
          <p className="measure mt-5 text-base text-fg-muted">
            Kettleworth writes the block, reads every set you log, and moves tomorrow&apos;s
            numbers before you get there. One sheet. No guessing what to do next.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="xl"><Link href={cta.href}>{cta.label}</Link></Button>
            <Button asChild size="xl" variant="secondary"><Link href="/library">Browse the library</Link></Button>
          </div>
          <p className="mt-4 text-xs text-fg-subtle">No card. Twenty questions. Cancel whenever.</p>
        </div>
      </section>

      {/* 2 — The week, as a table. The product is a table, so one section is one. */}
      <section id="week" className="mx-auto w-full max-w-[1200px] px-4 pt-section sm:px-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="font-display text-2xl">This is the week. Nothing else is.</h2>
          <p className="meta">Week 5 of 9 · build</p>
        </div>
        <WeekTable />
      </section>

      {/* 3 — The conveyor: the one thing on the page that moves by itself. */}
      <section id="block" className="mt-section border-y border-rule">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-section sm:px-6">
          <Conveyor />
        </div>
      </section>

      {/* 4 — Method as a numbered editorial index. Type and rules, no cards. */}
      <section id="method" className="mx-auto w-full max-w-[1200px] px-4 py-section sm:px-6">
        <h2 className="meta mb-8">How it decides</h2>
        <div>
          {METHOD.map((m) => (
            <article key={m.n} className="grid gap-x-8 gap-y-2 border-t border-rule py-7 sm:grid-cols-[4rem_minmax(0,20rem)_minmax(0,1fr)]">
              <p className="font-display text-2xl tabular text-fg-subtle">{m.n}</p>
              <h3 className="font-display text-xl">{m.h}</h3>
              <p className="measure text-base text-fg-muted">{m.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 5 — Image band. The second and last photograph on the page. */}
      <section className="border-t border-rule">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-section sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
          <div>
            <p className="font-display text-3xl leading-[1.12]">
              Hit every rep and the bar goes up. Sleep badly and today eases off.
              Nothing happens silently, and nothing happens for a reason you cannot read.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-rule pt-5">
              <Readout label="Movements" value="850" note="cues and mistakes on each" />
              <Readout label="Block length" value="8–12" unit="wk" />
              <Readout label="Set-by-set" value="every" note="load decision shown" />
            </div>
          </div>
          <img
            src="/art/grip.jpg"
            alt="Chalked hands gripping a loaded barbell"
            width={900}
            height={900}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full rounded-lg object-cover"
          />
        </div>
      </section>

      {/* 6 — Close. Same pill pair, same sizes as the hero. */}
      <section className="mx-auto w-full max-w-[1200px] border-t border-rule px-4 py-section sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h2 className="font-display text-3xl">Twenty questions, then an eight-week block.</h2>
            <p className="measure mt-4 text-base text-fg-muted">
              Answer them once. The block is written around your body, your kit and the days
              you can actually train, and it keeps moving after that.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="xl"><Link href={cta.href}>{cta.label}</Link></Button>
            <Button asChild size="xl" variant="secondary"><Link href="/library">See the library</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}

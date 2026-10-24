import Link from "next/link";
import { ArrowRight, Activity, Brain, Dumbbell, HeartPulse, Salad, Users, Watch } from "lucide-react";
import { Badge, Button, Card, CardContent, Ring } from "@kettleworth/ui";
import { Hero } from "@/components/marketing/hero";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { Reveal } from "@/components/motion/reveal";
import { getSession } from "@/lib/session";
// Rendered per request: these pages read the exercise library, and the production build must not need a database.
export const dynamic = "force-dynamic";

const pillars = [
  { icon: Brain, title: "A coach that actually knows you", body: "A conversational intake learns your body, goals, schedule, equipment, injuries and the exercises you hate. Your training profile is yours to review and edit." },
  { icon: Dumbbell, title: "Periodised programmes, not random workouts", body: "8 to 12 week blocks with real progression, deloads and RPE targets. Every exercise comes with a one-line reason it's there." },
  { icon: Activity, title: "Adapts every week", body: "Hit every rep? Load goes up. Slept badly? Today eases off. Every change is explained in plain English." },
  { icon: Salad, title: "Nutrition that fits your life", body: "Calorie and macro targets, weekly meal plans, recipes and a grocery list that respect your diet, allergies, budget and cooking time." },
  { icon: Watch, title: "Recovery from your wearable", body: "Connect Whoop, Oura, Garmin, Fitbit, Polar or Strava. Readiness, sleep and HRV shape each session's intensity." },
  { icon: Users, title: "People who train like you", body: "Matched on goals, level and schedule. Training partners, groups and session challenges. Private until you opt in." },
];

const proof = [
  "Working weights suggested from your estimated 1RMs",
  "Rest countdown with haptic-feel transitions",
  "PR celebrations when you beat your best",
  "Works offline; syncs when you're back",
];

export default async function Landing() {
  const session = await getSession();
  return (
    <main>
      <Hero />

      <section id="how" className="page py-section">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="space-y-6">
            <p className="eyebrow">Today's session</p>
            <h2 className="font-display text-3xl text-balance md:text-4xl">One exercise at a time. Timers, targets, and the reason behind every set.</h2>
            <p className="measure text-lg text-fg-muted">Two taps to log a set. Rest counted for you. Demo inline. Swaps that respect your kit and your injuries.</p>
            <ul className="space-y-3 text-fg-muted">
              {proof.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-fg-subtle" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            <img
              src="/art/grip.jpg"
              alt="Chalked hands gripping a loaded barbell"
              loading="lazy"
              decoding="async"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full rounded-3xl object-cover ring-1 ring-border"
            />
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden py-section">
        <img src="/art/upper-f.jpg" alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 -z-20 size-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_45%,transparent)_50%,var(--color-bg)_100%)]" />
        <Reveal className="page text-center">
          <p className="eyebrow">Every week</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl tracking-tightest text-balance md:text-6xl">
            Hit every rep and the bar goes up. Sleep badly and today eases off. Nothing is silent.
          </h2>
        </Reveal>
      </section>

      <section id="inside" className="border-y border-border bg-bg-elevated py-section">
        <div className="page">
          <Reveal className="mb-12 max-w-2xl space-y-3">
            <p className="eyebrow">What's inside</p>
            <h2 className="font-display text-3xl text-balance md:text-4xl">Everything a great coach does, integrated rather than bolted on.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={Math.min(i, 5) * 60}>
                <Card className="h-full">
                  <CardContent className="space-y-3">
                    <div aria-hidden className="grid size-11 place-items-center rounded-xl bg-surface-2 text-fg-muted ring-1 ring-border">
                      <p.icon className="size-5" />
                    </div>
                    <h3 className="font-display text-lg">{p.title}</h3>
                    <p className="text-sm text-fg-muted">{p.body}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page py-section">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 flex justify-center lg:order-1">
            <div className="surface flex flex-wrap items-center gap-8 rounded-3xl p-8">
              <Ring value={0.82} size={132} stroke={12} tone="signal" label="Readiness 82">
                <div className="text-center">
                  <div className="font-display text-3xl tabular">82</div>
                  <div className="text-2xs uppercase tracking-label text-fg-subtle">Readiness</div>
                </div>
              </Ring>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><HeartPulse className="size-4 text-signal" /><span className="text-fg-muted">HRV up 9% vs 7-day</span></div>
                <Badge tone="signal">Green light</Badge>
                <p className="max-w-[200px] text-fg-muted">Train as planned. Squat target 100 kg × 5 at RPE 8.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80} className="order-1 space-y-6 lg:order-2">
            <p className="eyebrow">Explainable by design</p>
            <h2 className="font-display text-3xl text-balance md:text-4xl">The engine proposes. The evidence decides. You always see why.</h2>
            <p className="measure text-lg text-fg-muted">A rules engine owns the maths. The coach does the explaining. Every change arrives with its reason attached.</p>
          </Reveal>
        </div>
      </section>

      {/*
        Closing CTA — full-bleed (cta.gallery pattern), and signature moment 2: a slow warm
        gradient drift behind the ask. Transform-only, paused under reduced motion by the
        global media query in tokens.css.
      */}
      <section id="closer" data-theme="dark" className="relative isolate overflow-hidden border-t border-border bg-bg py-section text-fg">
        <img
          src="/art/closer.webp"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 size-full object-cover opacity-80"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_70%,transparent)_45%,var(--color-bg)_100%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 size-[140%] -translate-x-1/2 -translate-y-1/2 animate-ember-drift bg-[radial-gradient(45%_45%_at_50%_50%,color-mix(in_oklch,var(--color-ember)_16%,transparent)_0%,transparent_70%)]" />
        </div>
        <Reveal className="page text-center">
          <p className="eyebrow">Start today</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl tracking-tightest text-balance md:text-6xl">
            Your first block is twenty questions away.
          </h2>
          <p className="measure mx-auto mt-5 text-lg text-fg-muted">
            Answer them once and the engine writes an eight-week block around your body, your kit and the days you can actually train.
          </p>
          <div className="mt-9 flex justify-center">
            <Button asChild size="xl">
              <Link href={session ? "/app" : "/sign-up"}>{session ? "Open app" : "Start free"} <ArrowRight /></Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-fg-subtle">No card required · about two minutes</p>
        </Reveal>
      </section>

      <StickyCta signedIn={!!session} />
    </main>
  );
}

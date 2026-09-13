import Link from "next/link";
import { ArrowRight, Activity, Brain, Dumbbell, HeartPulse, Salad, Users, Watch } from "lucide-react";
import { Badge, Button, Card, CardContent, Ring } from "@kettleworth/ui";
import { Hero } from "@/components/marketing/hero";
import { SessionMock } from "@/components/marketing/session-mock";

const pillars = [
  { icon: Brain, title: "A coach that actually knows you", body: "A conversational intake learns your body, goals, schedule, equipment, injuries and the exercises you hate. Your training profile is yours to review and edit." },
  { icon: Dumbbell, title: "Periodised programmes, not random workouts", body: "8 to 12 week blocks with real progression, deloads and RPE targets. Every exercise comes with a one-line reason it's there." },
  { icon: Activity, title: "Adapts every week", body: "Hit every rep? Load goes up. Slept badly? Today eases off. Every change is explained in plain English." },
  { icon: Salad, title: "Nutrition that fits your life", body: "Calorie and macro targets, weekly meal plans, recipes and a grocery list that respect your diet, allergies, budget and cooking time." },
  { icon: Watch, title: "Recovery from your wearable", body: "Connect Whoop, Oura, Garmin, Fitbit, Polar or Strava. Readiness, sleep and HRV shape each session's intensity." },
  { icon: Users, title: "People who train like you", body: "Match with lifters on the same goals and schedule, join groups, take on challenges. Private by default." },
];

export default function Landing() {
  return (
    <main>
      <Hero />
      <section id="how" className="page py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <p className="eyebrow">Today's session</p>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">One exercise at a time. Timers, targets, and the reason behind every set.</h2>
            <p className="text-lg text-fg-muted">Two taps to log a set. Rest counted for you. Demo inline. Swaps that respect your kit and your injuries.</p>
            <ul className="space-y-3 text-fg-muted">
              {["Working weights suggested from your estimated 1RMs", "Rest countdown with haptic-feel transitions", "PR celebrations when you beat your best", "Works offline; syncs when you're back"].map((t) => (<li key={t} className="flex items-start gap-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ember" />{t}</li>))}
            </ul>
          </div>
          <SessionMock />
        </div>
      </section>
      <section id="pillars" className="border-y border-border bg-bg-elevated py-20 md:py-28">
        <div className="page">
          <div className="mb-12 max-w-2xl space-y-3"><p className="eyebrow">What's inside</p><h2 className="font-display text-3xl font-semibold md:text-4xl">Everything a great coach does, integrated rather than bolted on.</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <Card key={p.title} className="animate-fade-up"><CardContent className="space-y-3"><div className="grid size-10 place-items-center rounded-lg bg-ember-soft text-ember"><p.icon className="size-5" /></div><h3 className="font-display text-lg font-semibold">{p.title}</h3><p className="text-sm text-fg-muted">{p.body}</p></CardContent></Card>
            ))}
          </div>
        </div>
      </section>
      <section className="page py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="order-2 flex justify-center md:order-1">
            <div className="surface flex items-center gap-8 rounded-2xl p-8">
              <Ring value={0.82} size={132} stroke={12} tone="signal" label="Readiness 82"><div className="text-center"><div className="font-display text-3xl font-semibold tabular">82</div><div className="text-2xs uppercase tracking-wide text-fg-subtle">Readiness</div></div></Ring>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><HeartPulse className="size-4 text-signal" /><span className="text-fg-muted">HRV up 9% vs 7-day</span></div>
                <div className="flex items-center gap-2"><Badge tone="signal">Green light</Badge></div>
                <p className="max-w-[200px] text-fg-muted">Train as planned. Squat target 100 kg × 5 at RPE 8.</p>
              </div>
            </div>
          </div>
          <div className="order-1 space-y-6 md:order-2">
            <p className="eyebrow">Explainable by design</p>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">The AI proposes. The rules decide. You always see why.</h2>
            <p className="text-lg text-fg-muted">A rules engine owns the maths. The model does the coaching. Every change comes with its reason.</p>
            <Button asChild size="lg"><Link href="/sign-up">Build my programme <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}

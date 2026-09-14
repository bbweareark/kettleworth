"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@kettleworth/ui";

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.08 * i, ease: [0.25, 1, 0.5, 1] as const } });
  return (
    <section className="relative overflow-hidden">
      <img src="/art/landing.jpg" alt="" aria-hidden className="pointer-events-none absolute inset-0 -z-20 size-full object-cover" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--color-bg)_55%,transparent)_0%,color-mix(in_oklch,var(--color-bg)_35%,transparent)_50%,var(--color-bg)_100%)]" />
      <div className="page flex min-h-[88dvh] flex-col items-center justify-center py-24 text-center md:py-36">
        <motion.p {...fade(0)} className="eyebrow mb-6">Personal trainer · Nutritionist · Training crew</motion.p>
        <motion.h1 {...fade(1)} className="font-display max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tightest sm:text-5xl md:text-6xl lg:text-[4.5rem]">
          Training built for <span className="text-ember">your</span> body, your week, your kit.
        </motion.h1>
        <motion.p {...fade(2)} className="mt-6 max-w-2xl text-lg text-fg-muted md:text-xl">A coach that knows your body, your schedule and your kit. It plans, watches every set, and recalibrates every week.</motion.p>
        <motion.div {...fade(3)} className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="xl"><Link href="/sign-up">Start free <ArrowRight /></Link></Button>
          <Button asChild size="xl" variant="secondary"><Link href="/library">Browse 850+ exercises</Link></Button>
        </motion.div>
        <motion.p {...fade(4)} className="mt-4 text-xs text-fg-subtle">No card. Web app today, iOS and Android next.</motion.p>
      </div>
    </section>
  );
}

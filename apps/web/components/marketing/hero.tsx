"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@kettleworth/ui";
import { SessionMock } from "@/components/marketing/session-mock";

/**
 * Hero: oversized type with the product as artifact (supahero.io — Superpower), staged as the
 * DNA's void-mode reveal: the session player floating in warm darkness, headline flanking it.
 *
 * Signature moment 1 — the headline's lines clip-mask up, staggered 70ms. It is pure CSS, it
 * runs once, and the text is legible even if it never fires: each line sits in an
 * overflow-hidden mask and animates from 105% to 0, so with animations neutralised by
 * prefers-reduced-motion the line is simply already in place.
 *
 * One primary action. The old hero showed four CTAs at once, two of them competing ember
 * fills that both went to /sign-up.
 */
const LINES = ["Training built for", "your body, your week,", "your kit."];

export function Hero() {
  return (
    // The hero is a photographic void: it keeps the dark palette in both themes so cream type
    // always clears the image beneath it. A light-theme hero washed the eyebrow out.
    <section data-theme="dark" className="relative overflow-hidden text-fg">
      <img
        src="/art/landing.jpg"
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        width={1920}
        height={1280}
        className="pointer-events-none absolute inset-0 -z-20 size-full object-cover"
      />
      <div aria-hidden className="scrim pointer-events-none absolute inset-0 -z-10" />

      <div className="page grid min-h-[88svh] items-center gap-12 py-24 md:py-28 lg:grid-cols-[1.05fr_minmax(0,380px)] lg:gap-16">
        <div>
          <p className="eyebrow animate-fade-up">Personal trainer · Nutritionist · Training crew</p>

          <h1 className="mt-6 font-display text-hero font-semibold text-balance">
            {LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span className="block animate-line-up" style={{ animationDelay: `${120 + i * 70}ms` }}>{line}</span>
              </span>
            ))}
          </h1>

          <p className="measure mt-7 animate-fade-up text-lg text-fg-muted md:text-xl" style={{ animationDelay: "360ms" }}>
            It plans the block, watches every set you log, and recalibrates the week around your sleep, your kit and the days you actually show up.
          </p>

          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "440ms" }}>
            <Button asChild size="xl" id="hero-cta"><Link href="/sign-up">Start free <ArrowRight /></Link></Button>
            <Link href="/library" className="inline-flex h-11 items-center text-sm font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline">
              Browse 850+ exercises
            </Link>
          </div>

          <p className="mt-5 animate-fade-up text-xs text-fg-subtle" style={{ animationDelay: "500ms" }}>
            No card. Web app today, iOS and Android next.
          </p>
        </div>

        <div className="animate-fade-up lg:justify-self-end" style={{ animationDelay: "560ms" }}>
          <SessionMock />
        </div>
      </div>
    </section>
  );
}

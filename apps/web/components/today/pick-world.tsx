"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@kettleworth/ui";

/**
 * The invitation to choose a world, on Today, once.
 *
 * This exists because of a real failure: three worlds shipped, locked behind a settings panel
 * nobody had a reason to open, and the owner's verdict on the new one was "it looks the same,
 * no UI change is there". It did look the same. He was still in Carbon, because that is what
 * every account starts in and nothing ever said otherwise.
 *
 * So the app asks, once, in the place everybody lands, and shows the three grounds rather than
 * describing them. It disappears for good once a world is chosen, which is what `styleLockedAt`
 * on the profile records.
 */
const SWATCHES: { style: string; theme: string; name: string }[] = [
  { style: "carbon", theme: "dark", name: "Carbon" },
  { style: "arc", theme: "light", name: "Arc" },
  { style: "sanctuary", theme: "light", name: "Sanctuary" },
];

export function PickWorld() {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="border-t border-rule pt-4"
    >
      <p className="meta">Three worlds</p>
      <h2 className="mt-1 font-display text-2xl tracking-tightest">This app can look like someone else entirely.</h2>
      <p className="measure mt-2 text-sm text-fg-muted">
        Same engine, same numbers, same plan. One of them trains you like an instrument, one like the main character of a
        fight, one like something you are looking after. Pick the one that gets you to the gym.
      </p>

      {/* The grounds themselves, each in its own tokens: a row of words would say nothing. */}
      <div className="mt-4 flex gap-2">
        {SWATCHES.map((s) => (
          <div
            key={s.style}
            data-style={s.style}
            data-theme={s.theme}
            className="flex-1 overflow-hidden rounded-lg border border-rule bg-bg p-3 text-fg"
          >
            <p className="font-display text-2xl leading-none tracking-tightest">82<span className="text-sm">.5</span></p>
            <p className="meta mt-1 truncate">{s.name}</p>
            <div aria-hidden className="mt-2 h-1 bg-rule"><div className="h-full w-2/3 bg-volt" /></div>
          </div>
        ))}
      </div>

      <Button asChild className="mt-4"><Link href="/app/style">See the three <ArrowRight /></Link></Button>
    </motion.section>
  );
}

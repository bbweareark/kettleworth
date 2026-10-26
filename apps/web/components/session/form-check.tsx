"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Lightbulb, ShieldAlert, XCircle, Check, ChevronRight } from "lucide-react";
import { Button, cn } from "@kettleworth/ui";

export type CheckCard = { kind: "cue" | "mistake" | "safety" | "foryou"; text: string };

const STYLE = {
  cue: { icon: Lightbulb, label: "Do this", ring: "border-ember/50", glow: "var(--color-ember)", chip: "bg-ember text-ember-fg" },
  mistake: { icon: XCircle, label: "Not this", ring: "border-ember/50", glow: "var(--color-rose)", chip: "bg-rose text-white" },
  safety: { icon: ShieldAlert, label: "Protect", ring: "border-ember/50", glow: "var(--color-amber)", chip: "bg-amber text-black" },
  foryou: { icon: ShieldAlert, label: "For you", ring: "border-ember/60", glow: "var(--color-amber)", chip: "bg-amber text-black" },
} as const;

/**
 * Set-up check: one big card at a time (cue, mistake, safety, personal caution), tapped through before the first working set.
 * Shown the first 3 times an exercise appears for this user, then collapses to a single tap-to-reopen chip. Acknowledgement is per exercise
 * and stored locally, so it never nags but is impossible to miss on new movements.
 */
export function FormCheck({ exerciseId, name, cards, image, onReady }: { exerciseId: string; name: string; cards: CheckCard[]; image?: string; onReady?: () => void }) {
  const key = `kw-formcheck:${exerciseId}`;
  const [seen, setSeen] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { try { const n = Number(localStorage.getItem(key) ?? 0); setSeen(n); setOpen(n < 3 && cards.length > 0); } catch { setSeen(0); setOpen(cards.length > 0); } }, [key, cards.length]);
  if (seen === null || !cards.length) return null;
  const done = () => { try { localStorage.setItem(key, String((seen ?? 0) + 1)); } catch {} setSeen((s) => (s ?? 0) + 1); setOpen(false); onReady?.(); };
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 border border-border bg-surface-2 px-4 py-2.5 text-left text-sm transition-colors hover:border-border-strong">
      <span className="flex -space-x-1">{cards.slice(0, 3).map((c, k) => { const I = STYLE[c.kind].icon; return <span key={k} className={cn("grid size-6 place-items-center  border-2 border-bg", STYLE[c.kind].chip)}><I className="size-3" /></span>; })}</span>
      <span className="flex-1 text-fg-muted">Set-up check for {name}</span><ChevronRight className="size-4 text-fg-subtle" />
    </button>
  );
  /*
    All the cues at once, as a ruled list.

    It used to be a carousel: one cue in a bordered card with a 1-of-3 pager and a Next
    button, measured at 193px to show a single sentence like "Elbows tucked, upper arms
    still", on a session screen already running 1573px against a 659px viewport. Set-up cues
    are three short lines; paging through them costs two taps and most of the screen to say
    less. Read together they also make more sense, because they describe one position.
  */
  return (
    <div className="border-y border-rule py-3" role="group" aria-label={`Set-up check for ${name}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="meta">Do this</span>
        <button type="button" onClick={done} className="meta underline underline-offset-4 hover:text-fg">
          Got it
        </button>
      </div>
      <ul className="mt-2 space-y-1.5">
        {cards.map((c, k) => {
          const S = STYLE[c.kind]; const I = S.icon;
          return (
            <li key={k} className="flex items-start gap-2.5 text-sm leading-snug">
              <I aria-hidden className="mt-0.5 size-4 shrink-0 text-ember" />
              <span className="measure">{c.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One rotating tip shown inside the rest timer: uses rest time to reinforce technique instead of leaving it blank. */
export function RestTip({ cards }: { cards: CheckCard[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => { if (reduce || cards.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % cards.length), 6000); return () => clearInterval(t); }, [cards.length, reduce]);
  const c = cards[i]; if (!c) return null; const S = STYLE[c.kind]; const I = S.icon;
  return (
    <div className="mt-4 flex items-start gap-3 p-3 text-sm">
      <span className={cn("grid size-7 shrink-0 place-items-center ", S.chip)}><I className="size-3.5" /></span>
      <div className="min-w-0"><div className="text-2xs font-semibold uppercase tracking-label text-fg-subtle">While you rest · {S.label}</div><AnimatePresence mode="wait" initial={false}><motion.p key={i} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} className="text-fg">{c.text}</motion.p></AnimatePresence></div>
    </div>
  );
}

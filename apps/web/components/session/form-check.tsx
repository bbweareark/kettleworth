"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Lightbulb, ShieldAlert, XCircle, Check, ChevronRight } from "lucide-react";
import { Button, cn } from "@kettleworth/ui";

export type CheckCard = { kind: "cue" | "mistake" | "safety" | "foryou"; text: string };

const STYLE = {
  cue: { icon: Lightbulb, label: "Do this", ring: "border-ember/50", glow: "var(--color-ember)", chip: "bg-ember text-ember-fg" },
  mistake: { icon: XCircle, label: "Not this", ring: "border-rose/50", glow: "var(--color-rose)", chip: "bg-rose text-white" },
  safety: { icon: ShieldAlert, label: "Protect", ring: "border-amber/50", glow: "var(--color-amber)", chip: "bg-amber text-black" },
  foryou: { icon: ShieldAlert, label: "For you", ring: "border-amber/60", glow: "var(--color-amber)", chip: "bg-amber text-black" },
} as const;

/**
 * Set-up check: one big card at a time (cue, mistake, safety, personal caution), tapped through before the first working set.
 * Shown the first 3 times an exercise appears for this user, then collapses to a single tap-to-reopen chip. Acknowledgement is per exercise
 * and stored locally, so it never nags but is impossible to miss on new movements.
 */
export function FormCheck({ exerciseId, name, cards, image, onReady }: { exerciseId: string; name: string; cards: CheckCard[]; image?: string; onReady?: () => void }) {
  const reduce = useReducedMotion();
  const key = `kw-formcheck:${exerciseId}`;
  const [seen, setSeen] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => { try { const n = Number(localStorage.getItem(key) ?? 0); setSeen(n); setOpen(n < 3 && cards.length > 0); } catch { setSeen(0); setOpen(cards.length > 0); } }, [key, cards.length]);
  if (seen === null || !cards.length) return null;
  const done = () => { try { localStorage.setItem(key, String((seen ?? 0) + 1)); } catch {} setSeen((s) => (s ?? 0) + 1); setOpen(false); setI(0); onReady?.(); };
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-left text-sm transition-colors hover:border-border-strong">
      <span className="flex -space-x-1">{cards.slice(0, 3).map((c, k) => { const I = STYLE[c.kind].icon; return <span key={k} className={cn("grid size-6 place-items-center rounded-full ring-2 ring-surface-2", STYLE[c.kind].chip)}><I className="size-3" /></span>; })}</span>
      <span className="flex-1 text-fg-muted">Set-up check for {name}</span><ChevronRight className="size-4 text-fg-subtle" />
    </button>
  );
  const c = cards[i]!; const S = STYLE[c.kind]; const I = S.icon; const last = i === cards.length - 1;
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border-2 bg-bg-elevated p-5 shadow-pop", S.ring)} role="group" aria-label={`Set-up check ${i + 1} of ${cards.length}`}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-30 blur-3xl" style={{ background: S.glow }} />
      <div className="relative flex items-start gap-4">
        {image ? <img src={image} alt="" className="hidden size-24 shrink-0 rounded-xl object-cover sm:block" /> : null}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2"><span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.14em]", S.chip)}><I className="size-3" /> {S.label}</span><span className="text-2xs text-fg-subtle">{i + 1} / {cards.length}</span></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={i} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.22 }} className="font-display text-xl font-semibold leading-snug tracking-tighter md:text-2xl">{c.text}</motion.p>
          </AnimatePresence>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1" aria-hidden>{cards.map((_, k) => <span key={k} className={cn("h-1 rounded-full transition-all", k === i ? "w-6 bg-fg" : "w-2 bg-surface-3")} />)}</div>
        {last ? <Button onClick={done}><Check /> Got it, ready</Button> : <Button variant="secondary" onClick={() => setI((x) => x + 1)}>Next <ChevronRight /></Button>}
      </div>
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
    <div className="mt-4 flex items-start gap-3 rounded-xl bg-black/20 p-3 text-sm">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", S.chip)}><I className="size-3.5" /></span>
      <div className="min-w-0"><div className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">While you rest · {S.label}</div><AnimatePresence mode="wait" initial={false}><motion.p key={i} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} className="text-fg">{c.text}</motion.p></AnimatePresence></div>
    </div>
  );
}

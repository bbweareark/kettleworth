"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Trophy } from "lucide-react";
export function PRCelebration({ pr, onClose }: { pr: { name: string; headline: string; detail: string } | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {pr ? (
        <motion.div key="pr" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="fixed inset-x-4 top-20 z-50 mx-auto max-w-sm rounded-2xl border border-ember/40 bg-bg-elevated p-5 shadow-glow" role="status">
          <div className="flex items-center gap-4"><div className="grid size-12 place-items-center rounded-full bg-ember text-ember-fg"><Trophy className="size-6" /></div><div className="min-w-0"><div className="eyebrow text-ember">{pr.headline}</div><div className="font-display text-lg font-semibold">{pr.name}</div><div className="text-sm text-fg-muted">{pr.detail}</div></div></div>
          <button onClick={onClose} className="mt-3 w-full rounded-md bg-surface-2 py-2 text-sm font-medium hover:bg-surface-3">Keep going</button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

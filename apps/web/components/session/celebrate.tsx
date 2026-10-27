"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Trophy } from "lucide-react";
export function PRCelebration({ pr, onClose }: { pr: { name: string; headline: string; detail: string } | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {pr ? (
        <motion.div key="pr" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="fixed inset-x-4 top-20 z-50 mx-auto max-w-sm rounded-lg border border-volt/40 bg-surface p-5" role="status">
          <div className="flex items-center gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-full bg-volt text-volt-fg"><Trophy className="size-6" aria-hidden /></div><div className="min-w-0"><div className="meta text-volt">{pr.headline}</div><div className="font-display text-lg">{pr.name}</div><div className="text-sm text-fg-muted">{pr.detail}</div></div></div>
          <button onClick={onClose} className="mt-4 h-11 w-full rounded-full border border-rule-strong text-sm transition-colors hover:border-fg">Keep going</button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

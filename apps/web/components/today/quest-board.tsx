"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Swords, Shield, Check, Timer, Flame, ChevronRight, Home } from "lucide-react";
import { shouldAskAboutSession, type SideQuest } from "@kettleworth/core";
import { Button, cn, toast } from "@kettleworth/ui";

type Board = {
  main: { sessionId: string; name: string; scheduledOn: string; status: string; points: number; overdue: boolean } | null;
  canAsk: boolean; asked: boolean;
  side: { id: string; quest: SideQuest; status: "asked" | "completed" | "declined" } | null;
  streakWeeks: number; weekDone: number; weekPlanned: number; sideQuestsThisWeek: number;
};

/**
 * The quest board. The main quest is the session the engine assigned. If the day is running out and it is still
 * unfinished, the board asks once: did you train? Saying no offers a side quest, ten minutes at home, worth less
 * but enough to keep the week alive. The smaller reward is the point: it should always be worth doing the session.
 */
export function QuestBoard({ board: initial, todayIso }: { board: Board; todayIso: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [board, setBoard] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [localHour, setLocalHour] = useState<number | null>(null);
  useEffect(() => { setLocalHour(new Date().getHours()); }, []);

  const ask = useMemo(() => {
    if (!board.main || localHour == null) return false;
    return board.canAsk && shouldAskAboutSession({ status: board.main.status, scheduledOn: board.main.scheduledOn, todayIso, localHour, alreadyAsked: board.asked });
  }, [board, localHour, todayIso]);

  async function answer(a: "done" | "not_yet" | "swap") {
    setBusy(a);
    const r = await fetch("/api/quests/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: a }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Couldn't save that");
    if (a === "done") { toast.success(`Session logged. +${board.main?.points ?? 100} Growth.`); router.refresh(); return; }
    setBoard((b) => ({ ...b, asked: true, side: j.side ? { id: j.side.id, quest: j.side.quest, status: "asked" } : b.side }));
    if (a === "not_yet") toast.message("Left open. The board will be here.");
  }
  async function claim(id: string) {
    setBusy("claim");
    const r = await fetch("/api/quests/side", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Couldn't claim");
    setClaimed(true); setBoard((b) => ({ ...b, side: b.side ? { ...b.side, status: "completed" } : b.side, sideQuestsThisWeek: b.sideQuestsThisWeek + 1 }));
    toast.success(`Side quest done. +${j.points} Growth, streak intact.`);
    router.refresh();
  }

  if (!board.main && !board.side) return null;
  const mainDone = board.main?.status === "completed";
  return (
    <section className="relative overflow-hidden rounded-3xl bg-surface/50 p-5 ring-1 ring-white/[0.06]" aria-label="Quest board">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="eyebrow">Quest board</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-2xs uppercase tracking-[0.14em] text-fg-muted"><Shield className="size-3 text-ember" />{board.streakWeeks} week streak</span>
        <span className="ml-auto text-2xs uppercase tracking-[0.14em] text-fg-subtle tabular">{board.weekDone} / {board.weekPlanned} this week</span>
      </div>

      {/* Main quest */}
      {board.main ? (
        <div className={cn("relative overflow-hidden rounded-2xl p-4 ring-1 transition-colors", mainDone ? "bg-signal-soft ring-signal/30" : "bg-[linear-gradient(120deg,color-mix(in_oklch,var(--color-ember)_14%,transparent),transparent)] ring-ember/25")}>
          <div className="flex items-start gap-3">
            <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", mainDone ? "bg-signal/20" : "bg-ember-soft")}>{mainDone ? <Check className="size-5 text-signal" /> : <Swords className="size-5 text-ember" />}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xs uppercase tracking-[0.16em] text-ember">Main quest</span>
                {board.main.overdue && !mainDone ? <span className="rounded-full bg-amber-soft px-2 py-0.5 text-2xs uppercase tracking-[0.12em] text-amber">Yesterday's</span> : null}
                <span className="ml-auto font-display text-sm font-semibold tabular text-fg">+{board.main.points}</span>
              </div>
              <h3 className="mt-0.5 truncate font-display text-xl font-semibold tracking-tighter">{board.main.name}</h3>
              {!mainDone ? <Link href={`/app/session/${board.main.sessionId}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-ember hover:underline">Open the session <ChevronRight className="size-4" /></Link> : <p className="mt-1 text-sm text-signal">Complete. Full Growth claimed.</p>}
            </div>
          </div>

          <AnimatePresence>
            {ask && !mainDone ? (
              <motion.div initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="font-display text-base font-semibold tracking-tight">Did you train today?</p>
                  <p className="text-sm text-fg-muted">Answer honestly. There is a way to keep the week alive either way.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" loading={busy === "done"} onClick={() => answer("done")}><Check className="size-4" />Yes, it's done</Button>
                    <Button size="sm" variant="secondary" loading={busy === "not_yet"} onClick={() => answer("not_yet")}>Not yet, later</Button>
                    <Button size="sm" variant="secondary" loading={busy === "swap"} onClick={() => answer("swap")}><Home className="size-4" />No, give me 10 minutes</Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

      {/* Side quest */}
      <AnimatePresence>
        {board.side ? (
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <SideQuestCard quest={board.side.quest} done={board.side.status === "completed"} claimed={claimed} busy={busy === "claim"} onClaim={() => claim(board.side!.id)} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {board.sideQuestsThisWeek > 0 && !board.side ? <p className="mt-3 text-xs text-fg-subtle">{board.sideQuestsThisWeek} side quest{board.sideQuestsThisWeek === 1 ? "" : "s"} this week kept the streak alive.</p> : null}
    </section>
  );
}

/** Ten minutes, at home, tracked round by round. Nothing is claimable until every round is ticked. */
function SideQuestCard({ quest, done, claimed, busy, onClaim }: { quest: SideQuest; done: boolean; claimed: boolean; busy: boolean; onClaim: () => void }) {
  const reduce = useReducedMotion();
  const total = quest.rounds * quest.moves.length;
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  const complete = done || ticks.size >= total;
  const toggle = (k: string) => setTicks((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <div className={cn("rounded-2xl p-4 ring-1", done ? "bg-signal-soft ring-signal/30" : "bg-black/25 ring-white/[0.07]")}>
      <div className="flex items-start gap-3">
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", done ? "bg-signal/20" : "bg-sky-soft")}>{done ? <Check className="size-5 text-signal" /> : <Timer className="size-5 text-sky" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xs uppercase tracking-[0.16em] text-sky">Side quest</span>
            <span className="ml-auto font-display text-sm font-semibold tabular">+{quest.points}</span>
          </div>
          <h3 className="mt-0.5 font-display text-xl font-semibold tracking-tighter">{quest.title}</h3>
          <p className="mt-1 text-sm text-fg-muted">{quest.rounds} rounds, about {quest.minutes} minutes. {quest.why}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {quest.moves.map((m, i) => (
          <li key={m.exerciseId} className="flex items-center gap-3 rounded-xl bg-surface/50 px-3 py-2">
            <span className="w-4 text-center font-display text-xs text-fg-subtle tabular">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{m.name}<span className="ml-2 text-fg-subtle">{m.reps ? `${m.reps} reps` : `${m.seconds}s`}</span></span>
            <span className="flex gap-1">{Array.from({ length: quest.rounds }, (_, r) => { const k = `${i}-${r}`; const on = done || ticks.has(k); return (
              <button key={k} type="button" disabled={done} aria-label={`${m.name}, round ${r + 1}`} aria-pressed={on} onClick={() => toggle(k)} className={cn("size-6 rounded-md ring-1 transition-all active:scale-90", on ? "bg-ember text-ember-fg ring-ember" : "bg-white/[0.04] ring-white/10 hover:bg-white/10")}>{on ? <Check className="mx-auto size-3.5" /> : null}</button>); })}</span>
          </li>
        ))}
      </ul>
      {!done ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-ember" animate={{ width: `${(ticks.size / total) * 100}%` }} transition={{ duration: reduce ? 0 : 0.3 }} /></div>
          <Button size="sm" disabled={!complete} loading={busy} onClick={onClaim}><Flame className="size-4" />Claim {quest.points}</Button>
        </div>
      ) : (
        <motion.p initial={claimed && !reduce ? { scale: 0.9, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} className="mt-3 text-sm font-medium text-signal">Claimed. The week stays alive.</motion.p>
      )}
    </div>
  );
}

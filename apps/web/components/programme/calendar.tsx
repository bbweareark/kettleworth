"use client";
import Link from "next/link";
import { cn } from "@kettleworth/ui";

type S = { id: string; scheduledOn: string; status: string; name: string; weekId: string | null };
type Wk = { id: string; weekNumber: number; isDeload: boolean; mesocycleId: string; startsOn: string };
/** The block as a grid: weeks down, days across, one dot per session. Reads at a glance; no sentences. */
export function ProgrammeCalendar({ weeks, sessions, mesocycles, currentWeekId }: { weeks: Wk[]; sessions: S[]; mesocycles: { id: string; name: string }[]; currentWeekId: string | null }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dayIndex = (d: string) => (new Date(d + "T00:00:00Z").getUTCDay() + 6) % 7;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="mb-2 grid grid-cols-[6rem_3rem_repeat(7,1fr)] items-center gap-1 text-2xs uppercase tracking-[0.16em] text-fg-subtle"><span>Block</span><span>Wk</span>{days.map((d, i) => <span key={i} className="text-center">{d}</span>)}</div>
        {weeks.map((w) => {
          const meso = mesocycles.find((m) => m.id === w.mesocycleId);
          const first = weeks.find((x) => x.mesocycleId === w.mesocycleId)?.id === w.id;
          const ws = sessions.filter((s) => s.weekId === w.id);
          return (
            <div key={w.id} className={cn("grid grid-cols-[6rem_3rem_repeat(7,1fr)] items-center gap-1 rounded-md py-1.5", currentWeekId === w.id && "bg-ember-soft/60")}>
              <span className="truncate text-xs font-medium text-fg-muted">{first ? meso?.name : ""}</span>
              <span className={cn("font-display text-sm font-semibold tabular", w.isDeload ? "text-amber" : "text-fg")}>{w.weekNumber}{w.isDeload ? "·d" : ""}</span>
              {days.map((_, di) => {
                const s = ws.find((x) => dayIndex(x.scheduledOn) === di);
                if (!s) return <span key={di} className="mx-auto size-2 rounded-full bg-white/[0.06]" />;
                const cls = s.status === "completed" ? "bg-signal" : s.status === "skipped" ? "bg-white/20" : s.status === "in_progress" ? "bg-ember animate-pulse-soft" : s.scheduledOn < today ? "bg-rose/70" : "bg-fg/80";
                return <Link key={di} href={`/app/session/${s.id}`} title={`${s.name} · ${s.scheduledOn}`} aria-label={`${s.name} on ${s.scheduledOn}, ${s.status}`} className="group mx-auto grid size-7 place-items-center rounded-md hover:bg-white/10"><span className={cn("size-3 rounded-full transition-transform group-hover:scale-125", cls)} /></Link>;
              })}
            </div>);
        })}
        <div className="mt-3 flex flex-wrap gap-4 text-2xs uppercase tracking-[0.16em] text-fg-subtle"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-signal" /> done</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fg/80" /> planned</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose/70" /> missed</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-white/20" /> skipped</span><span className="flex items-center gap-1.5"><span className="text-amber">·d</span> deload</span></div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Sparkline } from "@kettleworth/ui";
import { dayMonth, fmtKg } from "@/lib/dates";

type Lift = { id: string; name: string; last: { date: string } | null; bestWeight: { weightKg: number; reps: number } | null; bestE1rm: { e1rm: number } | null; sessions: number; trend: number[] };

export function LiftsList({ lifts, units }: { lifts: Lift[]; units: "metric" | "imperial" }) {
  const unit = units === "metric" ? "kg" : "lb";
  if (!lifts.length) return <p className="rounded-2xl bg-surface/50 px-4 py-6 text-sm text-fg-muted ring-1 ring-white/[0.05]">Log your first session and each lift will appear here with its benchmark.</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {lifts.map((l) => (
        <li key={l.id}>
          <Link href={`/app/progress/lifts/${l.id}`} className="flex items-center gap-3 rounded-2xl bg-surface/50 p-3 ring-1 ring-white/[0.05] transition-colors hover:bg-surface">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{l.name}</div>
              <div className="mt-0.5 truncate text-xs text-fg-subtle">{l.bestWeight ? `Heaviest ${fmtKg(l.bestWeight.weightKg, units)} ${unit} × ${l.bestWeight.reps}` : "Bodyweight"}{l.bestE1rm ? ` · est. max ${fmtKg(l.bestE1rm.e1rm, units)} ${unit}` : ""}</div>
              <div className="text-2xs text-fg-subtle">{l.sessions} session{l.sessions === 1 ? "" : "s"}{l.last ? ` · last ${dayMonth(l.last.date)}` : ""}</div>
            </div>
            {l.trend.length > 1 ? <Sparkline points={l.trend} className="shrink-0" /> : null}
            <ChevronRight className="size-4 shrink-0 text-fg-subtle" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

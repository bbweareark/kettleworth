import Link from "next/link";
import { Check, ChevronRight, Moon } from "lucide-react";
import { cn } from "@kettleworth/ui";

type Ex = { name: string; sets: number; reps: string };
type Sess = { id: string; name: string; scheduledOn: string; status: string; estimatedMinutes: number; exercises: Ex[] };
const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function addDays(iso: string, n: number) { return new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10); }

/** Monday to Sunday in plain words: what each day is, what it involves, and whether it is done, missed or next. */
export function ThisWeek({ sessions, todayIso, openMissedId }: { sessions: Sess[]; todayIso: string; openMissedId: string | null }) {
  const d = new Date(`${todayIso}T12:00:00Z`);
  const monday = addDays(todayIso, -((d.getUTCDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const nextId = sessions.find((s) => s.scheduledOn > todayIso && s.status === "planned")?.id;
  return (
    <section className="rounded-lg border border-rule bg-surface p-4 sm:p-5" aria-label="This week">
      <div className="mb-3 flex items-baseline justify-between gap-2"><h2 className="font-display text-lg tracking-tight">This week</h2><span className="text-xs text-fg-subtle">Tap a day to see or start it</span></div>
      <ol className="space-y-2">
        {days.map((day) => {
          const list = sessions.filter((s) => s.scheduledOn === day);
          const dayName = day === todayIso ? "Today" : WEEKDAY[new Date(`${day}T12:00:00Z`).getUTCDay()]!;
          if (!list.length) return (
            <li key={day} className={cn("flex items-center gap-3 px-3 py-2 text-sm text-fg-subtle", day === todayIso && "bg-rule border border-rule")}>
              <span className="text-2xs font-medium uppercase tracking-label">{dayName}</span><Moon className="size-3.5" /> Rest
            </li>
          );
          return list.map((s) => {
            const status = s.status === "completed" ? { t: "Done", c: "text-fg bg-fg text-bg" }
              : s.status === "skipped" ? { t: "Skipped", c: "text-fg-subtle bg-rule" }
              : s.status === "in_progress" ? { t: "In progress", c: "text-volt " }
              : day === todayIso ? { t: "Today", c: "text-bg bg-volt" }
              : day < todayIso ? { t: "Missed", c: s.id === openMissedId ? "text-volt " : "text-fg-subtle bg-rule" }
              : s.id === nextId ? { t: "Up next", c: "text-fg bg-rule" } : null;
            const muted = s.status === "completed" || s.status === "skipped" || (day < todayIso && s.id !== openMissedId);
            return (
              <li key={s.id}>
                <Link href={`/app/session/${s.id}`} className={cn("group block p-3 border transition-colors hover:bg-rule", day === todayIso || s.id === nextId || s.id === openMissedId ? "bg-rule border-rule-strong" : "border-rule")}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-medium uppercase tracking-label text-fg-subtle">{dayName}</span>
                    {status ? <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap  px-2 py-0.5 text-2xs font-medium uppercase tracking-label", status.c)}>{s.status === "completed" ? <Check className="size-3" /> : null}{status.t}</span> : null}
                    <span className="ml-auto whitespace-nowrap text-xs text-fg-subtle">{s.estimatedMinutes} min</span>
                    <ChevronRight className="size-4 shrink-0 text-fg-subtle group-hover:text-fg" />
                  </div>
                  <p className={cn("mt-1 font-display text-lg tracking-tight", muted && "text-fg-muted")}>{s.name}</p>
                  {s.exercises.length && !muted ? (
                    <ul className="mt-2 divide-y divide-white/[0.05] text-sm">
                      {s.exercises.map((e, k) => <li key={k} className="flex items-baseline justify-between gap-3 py-1.5"><span className="min-w-0 text-fg-muted">{e.name}</span>{e.sets ? <span className="shrink-0 tabular text-xs text-fg-subtle">{e.sets} × {e.reps}</span> : null}</li>)}
                    </ul>
                  ) : s.exercises.length ? <p className="mt-1 line-clamp-1 text-xs text-fg-subtle">{s.exercises.map((e) => e.name).join(" · ")}</p> : null}
                </Link>
              </li>
            );
          });
        })}
      </ol>
    </section>
  );
}

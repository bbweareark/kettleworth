import { cn } from "@kettleworth/ui";

/**
 * The hero is a table, because the product is a table.
 *
 * Replicates teenage.engineering's catalogue grid (design/refs/dna-teenage-engineering):
 * cells run edge to edge with zero padding on the number columns, a heavy rule under the
 * column heads, hairlines between rows, and nothing boxed. No headline sits over a
 * photograph; the week's work is the headline.
 */
type Row = { day: string; name: string; focus: string; sets: string; load: string; state?: "done" | "now" | "rest" };

const WEEK: Row[] = [
  { day: "Mon", name: "Lower A", focus: "Squat · hinge", sets: "5 × 3–5", load: "102.5", state: "done" },
  { day: "Tue", name: "Rest", focus: "Walk, eat, sleep", sets: "—", load: "—", state: "rest" },
  { day: "Wed", name: "Upper A", focus: "Press · row", sets: "4 × 6–8", load: "72.5", state: "done" },
  { day: "Thu", name: "Rest", focus: "Walk, eat, sleep", sets: "—", load: "—", state: "rest" },
  { day: "Fri", name: "Lower B", focus: "Deadlift · lunge", sets: "4 × 4–6", load: "140.0", state: "now" },
  { day: "Sat", name: "Upper B", focus: "Pull · carry", sets: "4 × 8–10", load: "60.0" },
  { day: "Sun", name: "Rest", focus: "Walk, eat, sleep", sets: "—", load: "—", state: "rest" },
];

export function WeekTable({ className }: { className?: string }) {
  return (
    <table className={cn("w-full border-collapse text-left", className)}>
      <caption className="sr-only">An example training week</caption>
      <thead>
        <tr className="border-b-2 border-rule-strong">
          {["Day", "Session", "Focus", "Work", "Top set · kg"].map((h, i) => (
            <th
              key={h}
              scope="col"
              className={cn("meta pb-2 font-medium", i === 0 && "w-14", i >= 3 && "text-right", i === 2 && "hidden sm:table-cell")}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {WEEK.map((r) => (
          <tr
            key={r.day}
            className={cn(
              "border-b border-rule align-baseline",
              r.state === "rest" && "text-fg-subtle",
              r.state === "now" && "text-fg",
            )}
          >
            <td className="py-3 pr-3 text-meta uppercase tracking-label text-fg-subtle">{r.day}</td>
            <td className="py-3 pr-3">
              <span className={cn("font-display text-lg", r.state === "now" && "text-ember")}>{r.name}</span>
              {r.state === "now" && <span className="meta ml-2 text-ember">Today</span>}
              {r.state === "done" && <span className="meta ml-2 text-fg">Done</span>}
            </td>
            <td className="hidden py-3 pr-3 text-sm text-fg-muted sm:table-cell">{r.focus}</td>
            <td className="py-3 pl-3 text-right text-sm tabular">{r.sets}</td>
            <td className="py-3 pl-3 text-right font-display text-lg tabular">{r.load}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

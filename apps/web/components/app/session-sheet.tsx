import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@kettleworth/ui";

/**
 * Today's session: the one thing on this screen that matters.
 *
 * It was a raised panel, which made it one card among the five other blocks stacked down
 * Today, so nothing dominated and the screen read as a feed. It is now a band: it bleeds past
 * the page gutter to the full width of the canvas, the title is set at the top of the display
 * ramp, and the work runs as a ruled table underneath with a numbered margin, the exercise in
 * the display face and the loads right-aligned in a column you can read down.
 *
 * The table itself was a comprehension win in the previous build and design/SECTION-MAP.md
 * carries it over; what changed is that it stopped being in a box and started being the
 * section. The start button is still not in here: there is one primary action per viewport and
 * on this screen it is the sticky pill at the bottom.
 */
export type SheetRow = {
  id: string;
  name: string;
  detail: string;
  work: string;
  load: string;
  done: number;
  total: number;
};

export function SessionSheet({
  label,
  title,
  note,
  rows,
  href,
  minutes,
  focus,
}: {
  label: string;
  title: string;
  note?: string | null;
  rows: SheetRow[];
  href: string;
  cta?: string;
  minutes?: number;
  focus?: string[];
}) {
  const doneSets = rows.reduce((n, r) => n + r.done, 0);
  const totalSets = rows.reduce((n, r) => n + r.total, 0);

  return (
    <section aria-label="Today's session" className="-mx-4 border-y border-rule bg-surface sm:-mx-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-4 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <p className="meta">{label}</p>
            {/* The biggest thing on the screen after the figure, which is the point of it. */}
            <h2 className="mt-1 font-display text-4xl leading-[0.92] tracking-tightest">{title}</h2>
          </div>
          <p className="meta text-right">
            {doneSets} / {totalSets} sets{minutes ? ` · ${minutes} min` : ""}
            {focus?.length ? <span className="block">{focus.slice(0, 3).join(" · ")}</span> : null}
          </p>
        </div>
        {/* How far through the session is, as one hairline rather than as a widget. */}
        <div aria-hidden className="mx-4 h-0.5 bg-rule sm:mx-6">
          <div className="h-full bg-volt transition-[width] duration-500" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
        </div>
        {note ? <p className="measure px-4 pt-3 text-sm text-fg-muted sm:px-6">{note}</p> : null}

        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Exercises in this session</caption>
          <thead>
            <tr>
              <th scope="col" className="meta w-10 px-4 pb-2 pt-4 font-normal sm:px-6">#</th>
              <th scope="col" className="meta pb-2 pt-3 font-normal">Exercise</th>
              <th scope="col" className="meta hidden pb-2 pt-3 font-normal sm:table-cell">Target</th>
              <th scope="col" className="meta hidden pb-2 pt-3 text-right font-normal sm:table-cell">Work</th>
              <th scope="col" className="meta px-4 pb-2 pt-4 text-right font-normal sm:px-6">Load</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const complete = r.total > 0 && r.done >= r.total;
              const current = !complete && rows.slice(0, i).every((p) => p.done >= p.total);
              return (
                <tr key={r.id} className="border-t border-rule align-baseline">
                  <td className={cn("px-4 py-3.5 font-mono text-xs tabular sm:px-6", current ? "text-volt" : "text-fg-subtle")}>
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={cn("font-display text-xl leading-none", complete && "text-fg-subtle")}>{r.name}</span>
                    {current && <span className="meta ml-2 text-volt">Now</span>}
                    {complete && <span className="meta ml-2">Done</span>}
                    <span className="block text-xs text-fg-subtle sm:hidden">{r.work} · {r.detail}</span>
                  </td>
                  <td className="hidden py-3 pr-3 text-sm text-fg-muted sm:table-cell">{r.detail}</td>
                  <td className="hidden py-3 pl-2 text-right text-sm tabular text-fg-muted sm:table-cell">{r.work}</td>
                  <td className="px-4 py-3.5 text-right font-display text-xl tabular sm:px-6">{r.load}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Link href={href} className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3.5 text-sm text-fg-muted transition-colors hover:bg-bg hover:text-fg sm:px-6">
          Open the session plan
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
    </section>
  );
}

/** Nothing scheduled: say it plainly on the ground, with no panel and no action to press. */
export function RestSheet({ label, next, href }: { label: string; next: string | null; href: string | null }) {
  return (
    <section aria-label="Rest day" className="border-t border-rule pt-4">
      <p className="meta">{label}</p>
      <h2 className="mt-1 font-display text-2xl">No session today.</h2>
      <p className="measure mt-2 text-sm text-fg-muted">
        Muscle is built between sessions. Walk, eat, sleep early.
        {next ? ` Next up is ${next}.` : ""}
      </p>
      {href ? (
        <Link href={href} className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg transition-colors hover:text-volt">
          Preview the next session <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}

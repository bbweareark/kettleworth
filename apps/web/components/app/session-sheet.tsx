import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@kettleworth/ui";

/**
 * Today's session as one panel.
 *
 * The work itself is a ruled table: a numbered margin in mono, the exercise in the display
 * face, the target in support type and the load right-aligned and tabular so the loads form a
 * column you can read down. That part was a comprehension win in the previous build and is
 * carried over unchanged by design/SECTION-MAP.md.
 *
 * What changed is the frame and the action. The table now sits on a raised panel with a
 * hairline and a real radius, the way the DNA reference holds a block of content, and the
 * start button is gone from inside it: there is exactly one primary action per viewport and on
 * this screen it is the sticky pill at the bottom.
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
    <section aria-label="Today's session" className="overflow-hidden rounded-lg border border-rule bg-surface">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-4 py-4">
          <div>
            <p className="meta">{label}</p>
            <h2 className="mt-1 font-display text-2xl">{title}</h2>
          </div>
          <p className="meta text-right">
            {doneSets} / {totalSets} sets{minutes ? ` · ${minutes} min` : ""}
            {focus?.length ? <span className="block">{focus.slice(0, 3).join(" · ")}</span> : null}
          </p>
        </div>
        {note ? <p className="measure border-b border-rule px-4 py-3 text-sm text-fg-muted">{note}</p> : null}

        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Exercises in this session</caption>
          <thead>
            <tr>
              <th scope="col" className="meta w-10 px-4 pb-2 pt-3 font-normal">#</th>
              <th scope="col" className="meta pb-2 pt-3 font-normal">Exercise</th>
              <th scope="col" className="meta hidden pb-2 pt-3 font-normal sm:table-cell">Target</th>
              <th scope="col" className="meta hidden pb-2 pt-3 text-right font-normal sm:table-cell">Work</th>
              <th scope="col" className="meta px-4 pb-2 pt-3 text-right font-normal">Load</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const complete = r.total > 0 && r.done >= r.total;
              const current = !complete && rows.slice(0, i).every((p) => p.done >= p.total);
              return (
                <tr key={r.id} className="border-t border-rule align-baseline">
                  <td className={cn("px-4 py-3 font-mono text-xs tabular", current ? "text-volt" : "text-fg-subtle")}>
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={cn("font-display text-lg", complete && "text-fg-subtle")}>{r.name}</span>
                    {current && <span className="meta ml-2 text-volt">Now</span>}
                    {complete && <span className="meta ml-2">Done</span>}
                    <span className="block text-xs text-fg-subtle sm:hidden">{r.work} · {r.detail}</span>
                  </td>
                  <td className="hidden py-3 pr-3 text-sm text-fg-muted sm:table-cell">{r.detail}</td>
                  <td className="hidden py-3 pl-2 text-right text-sm tabular text-fg-muted sm:table-cell">{r.work}</td>
                  <td className="px-4 py-3 text-right font-display text-xl tabular">{r.load}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Link href={href} className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3.5 text-sm text-fg-muted transition-colors hover:bg-bg hover:text-fg">
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

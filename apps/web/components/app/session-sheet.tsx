import Link from "next/link";
import { Button, cn } from "@kettleworth/ui";

/**
 * Today's session, set as a sheet rather than a hero.
 *
 * This replaces the photographic hero card the previous build led with. The DNA reference
 * measures zero cards and puts the subject itself on the ground, so the subject here is the
 * work: a ruled table with a numbered margin, column heads in 12px uppercase, a heavy rule
 * under the head, and the figures right-aligned and tabular so the columns line up.
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
  cta,
  minutes,
  focus,
}: {
  label: string;
  title: string;
  note?: string | null;
  rows: SheetRow[];
  href: string;
  cta: string;
  minutes?: number;
  focus?: string[];
}) {
  const doneSets = rows.reduce((n, r) => n + r.done, 0);
  const totalSets = rows.reduce((n, r) => n + r.total, 0);

  return (
    <section aria-label="Today's session">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="meta">{label}</p>
        <p className="meta">
          {doneSets} / {totalSets} sets{minutes ? ` · ${minutes} min` : ""}
          {focus?.length ? ` · ${focus.slice(0, 3).join(" · ")}` : ""}
        </p>
      </div>

      <h1 className="mt-2 font-display text-3xl">{title}</h1>
      {note ? <p className="measure mt-2 text-sm text-fg-muted">{note}</p> : null}

      <table className="mt-6 w-full border-collapse text-left">
        <caption className="sr-only">Exercises in this session</caption>
        <thead>
          <tr className="border-b-2 border-rule-strong">
            <th scope="col" className="meta w-8 pb-2 font-medium">#</th>
            <th scope="col" className="meta pb-2 font-medium">Exercise</th>
            <th scope="col" className="meta hidden pb-2 font-medium sm:table-cell">Target</th>
            <th scope="col" className="meta hidden pb-2 text-right font-medium sm:table-cell">Work</th>
            <th scope="col" className="meta pb-2 text-right font-medium">Load</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const complete = r.total > 0 && r.done >= r.total;
            const current = !complete && rows.slice(0, i).every((p) => p.done >= p.total);
            return (
              <tr key={r.id} className="border-b border-rule align-baseline">
                <td className={cn("py-3 text-sm tabular", current ? "text-ember" : "text-fg-subtle")}>
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="py-3 pr-3">
                  <span className={cn("font-display text-lg", complete && "text-fg-muted")}>{r.name}</span>
                  {current && <span className="meta ml-2 text-ember">Now</span>}
                  {complete && <span className="meta ml-2 text-signal">Done</span>}
                  <span className="block text-xs text-fg-subtle sm:hidden">{r.work} · {r.detail}</span>
                </td>
                <td className="hidden py-3 pr-3 text-sm text-fg-muted sm:table-cell">{r.detail}</td>
                <td className="hidden py-3 pl-2 text-right text-sm tabular text-fg-muted sm:table-cell">{r.work}</td>
                <td className="py-3 pl-2 text-right font-display text-lg tabular">{r.load}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-6">
        <Button asChild size="lg"><Link href={href}>{cta}</Link></Button>
      </div>
    </section>
  );
}

/** Nothing scheduled: the sheet says so plainly and offers the next line. */
export function RestSheet({ label, next, href }: { label: string; next: string | null; href: string | null }) {
  return (
    <section aria-label="Rest day">
      <p className="meta">{label}</p>
      <h1 className="mt-2 font-display text-3xl">No session today.</h1>
      <p className="measure mt-2 text-sm text-fg-muted">
        Muscle is built between sessions. Walk, eat, sleep early.
        {next ? ` Next up is ${next}.` : ""}
      </p>
      {href ? (
        <div className="mt-6">
          <Button asChild size="lg" variant="secondary"><Link href={href}>Preview next session</Link></Button>
        </div>
      ) : null}
    </section>
  );
}

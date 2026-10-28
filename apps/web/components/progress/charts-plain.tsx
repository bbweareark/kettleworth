"use client";

/**
 * The parts of the Progress charts that do not need a charting library.
 *
 * They lived beside the Recharts charts, which meant re-exporting any one of them - the page
 * only wanted VolumeCompare, which is bars made of divs - pulled all 361KB of Recharts into
 * the first load. A module boundary is the only thing that stops that.
 */
/** "2026-W37" to the date of that week's Monday, so a week reads as "8 Sep". */
export function weekStart(isoWeekKey: string): string {
  const m = isoWeekKey.match(/^(\d{4})-W(\d{1,2})$/);
  if (!m) return isoWeekKey;
  const year = Number(m[1]), wk = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4); monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (wk - 1) * 7);
  return monday.toISOString().slice(0, 10);
}
/** 14000 as "14k", so the axis stays narrow. */
export const compact = (n: number) => (Math.abs(n) >= 10000 ? `${Math.round(n / 1000)}k` : Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n * 10) / 10));

/** What to show before there are two points: the number that exists, and when the line will appear. */
export function NotYet({ value, label, hint }: { value?: string | null; label: string; hint: string; icon?: string }) {
  return (
    <div className="flex min-h-28 flex-col justify-center border-t border-rule py-5">
      <div className="min-w-0">
        {value ? <div className="font-display text-3xl tabular tracking-tight">{value}</div> : null}
        <div className="text-2xs uppercase tracking-label text-fg-subtle">{label}</div>
        <p className="mt-1.5 text-sm text-fg-muted">{hint}</p>
      </div>
    </div>
  );
}

export function VolumeCompare({ thisWeek, lastWeek }: { thisWeek: Record<string, number>; lastWeek: Record<string, number> }) {
  const muscles = [...new Set([...Object.keys(thisWeek), ...Object.keys(lastWeek)])].sort((a, b) => (thisWeek[b] ?? 0) - (thisWeek[a] ?? 0)).slice(0, 8);
  if (!muscles.length) return <p className="text-sm text-fg-subtle">No sets logged in the last two weeks.</p>;
  const max = Math.max(1, ...muscles.map((m) => Math.max(thisWeek[m] ?? 0, lastWeek[m] ?? 0)));
  // Plain bars instead of a chart library: labels never truncate, and it reads cleanly at any width.
  return (
    <div className="space-y-2.5">
      <div className="flex justify-end gap-3 text-2xs text-fg-subtle"><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-volt" />This week</span><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-rule" />Last week</span></div>
      {muscles.map((m) => { const t = thisWeek[m] ?? 0, l = lastWeek[m] ?? 0; return (
        <div key={m} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2">
          <span className="truncate text-xs capitalize text-fg-muted">{m.replace(/_/g, " ")}</span>
          <div className="space-y-1"><div className="h-2 overflow-hidden bg-rule"><div className="h-full bg-volt" style={{ width: `${(t / max) * 100}%` }} /></div><div className="h-1.5 overflow-hidden bg-rule"><div className="h-full bg-rule" style={{ width: `${(l / max) * 100}%` }} /></div></div>
          <span className="text-right text-xs tabular text-fg">{t}</span>
        </div>); })}
    </div>
  );
}

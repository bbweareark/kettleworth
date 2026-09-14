import { Check, Timer } from "lucide-react";
import { Badge, Progress } from "@kettleworth/ui";

/** Static, illustrative render of the session player (real one lives at /app/session/[id]). */
export function SessionMock() {
  const sets = [{ n: 1, w: 50, r: 8, done: true, warm: true }, { n: 2, w: 75, r: 5, done: true, warm: true }, { n: 3, w: 100, r: 5, done: true }, { n: 4, w: 100, r: 5, done: false }, { n: 5, w: 100, r: 5, done: false }];
  return (
    <div className="surface mx-auto w-full max-w-sm rounded-3xl p-5" aria-hidden>
      <div className="mb-4 flex items-center justify-between text-xs text-fg-subtle"><span>Lower A · Week 3</span><span className="tabular">32:10</span></div>
      <Progress value={45} className="mb-5" />
      <div className="mb-1 flex items-center gap-2"><Badge tone="ember">Primary</Badge><span className="text-xs text-fg-subtle">Exercise 2 of 6</span></div>
      <h3 className="font-display text-2xl font-semibold tracking-tighter">Barbell Back Squat</h3>
      <p className="mt-1 text-sm text-fg-muted">5 × 3 to 5 @ RPE 8 · 3 min rest</p>
      <div className="mt-4 space-y-2">
        {sets.map((s) => (
          <div key={s.n} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${s.done ? "border-border bg-surface-2" : "border-border-strong bg-surface"}`}>
            <span className="w-5 text-xs text-fg-subtle tabular">{s.warm ? "W" : s.n - 2}</span>
            <span className="font-mono text-sm tabular">{s.w} kg</span>
            <span className="text-fg-subtle">×</span>
            <span className="font-mono text-sm tabular">{s.r}</span>
            <span className="ml-auto grid size-6 place-items-center rounded-full bg-signal-soft text-signal">{s.done ? <Check className="size-3.5" /> : null}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-ember-soft px-4 py-3"><div className="flex items-center gap-2 text-sm"><Timer className="size-4 text-ember" /> Rest</div><span className="font-mono text-2xl font-semibold tabular text-ember">1:42</span></div>
      <p className="mt-3 text-xs text-fg-muted">You hit 5 reps at RPE 7 last week, so squat is up 2.5 kg.</p>
    </div>
  );
}

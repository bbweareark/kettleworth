"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { Style } from "@kettleworth/types";
import { Button, Dialog, DialogContent, cn, toast } from "@kettleworth/ui";
import { Screen } from "@/components/app/screen";
import { applyStyle } from "@/lib/style";

/**
 * Choosing the world the app is lived in.
 *
 * Three worlds, stacked, each rendered in its own tokens rather than described in words: a
 * swatch row would say nothing, and three equal cards in the host style would say less. Every
 * band carries both `data-style` and `data-theme`, which is what lets the aliases declared on
 * the theme selectors resolve against that style's own primitives, so the preview is the real
 * thing and not an impression of it.
 *
 * The choice is locked on purpose. A surface you can flip hourly is a toy: the copy, the
 * motion and the reward language change with the world, so committing to one is the point.
 * Changing it later is possible and asks first.
 */
const WORLDS: { id: Style; name: string; line: string; idea: string; changes: string[]; light: "dark" | "light" }[] = [
  {
    id: "carbon",
    name: "Carbon",
    line: "The instrument",
    idea: "A dark room with one hard light. The load is the only bright thing on the screen.",
    changes: ["Near-black ground, one volt accent", "Condensed figures, hierarchy by size", "Plain reporting: what you lifted, what it means"],
    light: "dark",
  },
  {
    id: "arc",
    name: "Arc",
    line: "The training arc",
    idea: "A chapter in a fight. The work is the drama and the number going up is the plot.",
    changes: ["Paper and ink, square corners, no accent", "A set lands: the screen takes the blow", "The week reads as episodes, with this one marked"],
    light: "light",
  },
  {
    id: "sanctuary",
    name: "Sanctuary",
    line: "Stewardship",
    idea: "A stone hall with light through high glass. A body you are keeping, not punishing.",
    changes: ["Warm limestone, a serif, one aged gold", "The arch fills as the week is trained", "Kept, not conquered: the words change with it"],
    light: "light",
  },
];

export function StylePicker({ current, locked }: { current: Style; locked: boolean }) {
  const router = useRouter();
  const [live, setLive] = useState<Style>(current);
  const [ask, setAsk] = useState<Style | null>(null);
  const [busy, setBusy] = useState(false);

  async function commit(style: Style) {
    setBusy(true);
    applyStyle(style);
    setLive(style);
    setAsk(null);
    const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patch: { style, styleLockedAt: new Date().toISOString() } }) }).catch(() => null);
    setBusy(false);
    if (!r?.ok) return toast.error("Switched here, but it did not save to your account");
    toast.success(`${WORLDS.find((w) => w.id === style)!.name} it is. Locked in.`);
    router.refresh();
  }

  return (
    <Screen className="mx-auto max-w-3xl">
      <div>
        <p className="meta">Your world</p>
        <h1 className="mt-1 font-display text-3xl tracking-tightest">Pick the app you want to open</h1>
        <p className="measure mt-2 text-sm text-fg-muted">
          Three surfaces, the same engine underneath. The screens, the numbers and the plan are identical; what changes
          is the room they happen in and the words used to say well done. Pick the one that gets you to the gym, because
          this one sticks: changing it later asks first. Each one has a night and a daylight version, and the light
          stays yours: these three are shown in the light each was drawn for.
        </p>
      </div>

      {WORLDS.map((w) => {
        const on = live === w.id;
        return (
          <section
            key={w.id}
            data-style={w.id}
            data-theme={w.light}
            className="overflow-hidden rounded-lg border border-rule bg-bg text-fg"
            aria-label={`${w.name}, ${w.line}`}
          >
            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-end sm:p-5">
              <div className="min-w-0">
                <p className="meta">{w.line}</p>
                <h2 className="mt-1 font-display text-4xl leading-none tracking-tightest">{w.name}</h2>
                <p className="measure mt-2 text-sm text-fg-muted">{w.idea}</p>
                <ul className="mt-3 space-y-1 text-sm text-fg-muted">
                  {w.changes.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span aria-hidden className="mt-2 size-1 shrink-0 bg-volt" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* The world's own composition, at the size it is actually used: one figure, one
                  label, one rule, one action. Nothing here is a swatch. */}
              <div className="sm:w-56">
                <p className="meta">Working set</p>
                <p className="font-display text-figure leading-none tracking-tightest tabular text-volt">82<span className="text-2xl">.5</span></p>
                <p className="meta mt-1">kilograms · 8 reps</p>
                <div aria-hidden className="mt-3 h-1 bg-rule"><div className="h-full w-2/3 bg-volt" /></div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={on ? "secondary" : "primary"}
                    className="w-full"
                    disabled={on || busy}
                    onClick={() => (locked && !on ? setAsk(w.id) : commit(w.id))}
                  >
                    {on ? <><Check /> Your world</> : `Live in ${w.name}`}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <Dialog open={ask != null} onOpenChange={(o) => !o && setAsk(null)}>
        <DialogContent
          title={`Move to ${ask ? WORLDS.find((w) => w.id === ask)!.name : ""}?`}
          description="Every screen changes: the type, the colour, the way a finished set is marked and the words used to say it. Your training, history and plan are untouched."
        >
          <div className={cn("flex justify-end gap-2")}>
            <Button variant="ghost" onClick={() => setAsk(null)}>Stay here</Button>
            <Button loading={busy} onClick={() => ask && commit(ask)}>Move me</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Footprints, Plus, Waves, Dumbbell, Activity } from "lucide-react";
import { Button, Card, CardContent, Chip, ChipGroup, Field, Input, Sheet, SheetContent, cn, toast } from "@kettleworth/ui";

type Act = { id: string; provider: string; startAt: string; durationMin: number; payload: { type?: string; distanceKm?: number | null; calories?: number | null; intensity?: number } | null };
const TYPES = [["running", "Run"], ["cycling", "Ride"], ["swimming", "Swim"], ["walking", "Walk"], ["hiking", "Hike"], ["rowing", "Row"], ["hiit", "HIIT"], ["class", "Class (Blaze, spin…)"], ["football", "Football"], ["basketball", "Basketball"], ["tennis", "Tennis / padel"], ["climbing", "Climbing"], ["yoga", "Yoga"], ["martial_arts", "Martial arts"], ["dance", "Dance"], ["other", "Other"]];
const icon = (t?: string) => (t === "running" || t === "walking" || t === "hiking" ? Footprints : t === "cycling" ? Bike : t === "swimming" || t === "rowing" ? Waves : t === "class" || t === "hiit" ? Dumbbell : Activity);

export function ActivityLog({ initial }: { initial: Act[] }) {
  const router = useRouter();
  const [acts, setActs] = useState(initial);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("running");
  const [mins, setMins] = useState("30");
  const [intensity, setIntensity] = useState(3);
  const [km, setKm] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const r = await fetch("/api/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, durationMin: Number(mins), intensity, distanceKm: km ? Number(km) : null }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return toast.error(j.error ?? "Couldn't log");
    setActs(j.activities); setOpen(false); toast.success(`Logged. About ${j.kcal} kcal; today's readiness updated.`); router.refresh();
  }
  const total = acts.reduce((a, x) => a + x.durationMin, 0);
  return (
    <Card><CardContent>
      <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-base font-semibold">Other activity today</h3><Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Plus /> Log</Button></div>
      {acts.length ? (<ul className="space-y-2">{acts.map((a) => { const I = icon(a.payload?.type); return (<li key={a.id} className="flex items-center gap-3 text-sm"><I className="size-4 text-ember" /><span className="flex-1 capitalize">{(a.payload?.type ?? "workout").replace("_", " ")}{a.payload?.distanceKm ? ` · ${a.payload.distanceKm} km` : ""}</span><span className="tabular text-fg-muted">{Math.round(a.durationMin)} min{a.payload?.calories ? ` · ${a.payload.calories} kcal` : ""}</span><span className="text-2xs uppercase text-fg-subtle">{a.provider}</span></li>); })}</ul>) : <p className="text-sm text-fg-muted">Runs, rides, classes, sport. Log it and today's loads recalibrate.</p>}
      {total >= 45 && <p className="mt-3 text-xs text-amber">{total} min done: next session's loads eased.</p>}
      <Sheet open={open} onOpenChange={setOpen}><SheetContent title="Log activity" description="Anything that wasn't a Kettleworth session.">
        <div className="space-y-5">
          <Field label="What"><ChipGroup>{TYPES.map(([v, l]) => <Chip key={v} className="h-8 px-3 text-xs" selected={type === v} onClick={() => setType(v!)}>{l}</Chip>)}</ChipGroup></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Minutes"><Input inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} /></Field><Field label="Distance (km, optional)"><Input inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} /></Field></div>
          <Field label="How hard was it?"><div className="grid grid-cols-5 gap-1.5">{[["1", "Easy"], ["2", "Light"], ["3", "Moderate"], ["4", "Hard"], ["5", "All out"]].map(([n, l]) => <button key={n} type="button" aria-pressed={intensity === Number(n)} onClick={() => setIntensity(Number(n))} className={cn("h-12 rounded-md text-xs font-medium", intensity === Number(n) ? "bg-ember text-ember-fg" : "bg-surface-2 hover:bg-surface-3")}>{l}</button>)}</div></Field>
          <Button className="w-full" size="lg" onClick={save} loading={busy} disabled={!Number(mins)}>Save activity</Button>
        </div>
      </SheetContent></Sheet>
    </CardContent></Card>
  );
}

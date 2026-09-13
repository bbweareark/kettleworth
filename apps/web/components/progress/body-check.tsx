"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanLine, Sparkles, Trash2, Check } from "lucide-react";
import { Badge, Button, Card, CardContent, Chip, ChipGroup, CoachPulse, toast, cn } from "@kettleworth/ui";

type Analysis = { summary: string; build: string; bodyFatRangePct: [number, number] | null; strengths: string[]; focusAreas: { muscle: string; reason: string }[]; posture: string[]; caveats: string[]; analysedAt: string };
type Photo = { id: string; takenOn: string; pose: string; analysis: Analysis | null };
const label = (m: string) => m.replace(/_/g, " ");

export function BodyCheck({ initial, ai, priorityMuscles }: { initial: Photo[]; ai: boolean; priorityMuscles: string[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [pose, setPose] = useState<"front" | "side" | "back">("front");
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = photos.find((p) => p.analysis)?.analysis ?? null;
  const latestId = photos.find((p) => p.analysis)?.id ?? null;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy("upload");
    const fd = new FormData();
    for (const f of Array.from(files).slice(0, 3)) { fd.append("files", f); fd.append("poses", pose); }
    fd.append("takenOn", new Date().toISOString().slice(0, 10));
    const r = await fetch("/api/photos", { method: "POST", body: fd });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Upload failed");
    const list: Photo[] = await fetch("/api/photos").then((x) => x.json());
    setPhotos(list); setSelected(new Set(j.ids)); toast.success(`${j.ids.length} photo${j.ids.length > 1 ? "s" : ""} saved privately`);
  }
  async function analyse() {
    const ids = [...selected].slice(0, 3);
    if (!ids.length) return toast.error("Select up to three photos from the same day");
    setBusy("analyse");
    const r = await fetch(`/api/photos/${ids[0]}/analyse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Analysis failed");
    setPhotos((ps) => ps.map((p) => (ids.includes(p.id) ? { ...p, analysis: j } : p)));
    toast.success("Body read complete");
  }
  async function apply(kind: "priorityMuscles" | "bodyFat") {
    if (!latestId) return;
    setBusy(kind);
    const r = await fetch(`/api/photos/${latestId}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priorityMuscles: kind === "priorityMuscles", bodyFat: kind === "bodyFat" }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Couldn't apply");
    toast.success(kind === "priorityMuscles" ? `Prioritising ${j.priorityMuscles.map(label).join(", ")}. Extend or regenerate your programme to apply.` : `Body fat estimate set to ${j.bodyFatPct}%. Nutrition targets recalibrate.`);
    router.refresh();
  }
  async function remove(id: string) { await fetch(`/api/photos/${id}`, { method: "DELETE" }); setPhotos((ps) => ps.filter((p) => p.id !== id)); setSelected((s) => { const n = new Set(s); n.delete(id); return n; }); }

  return (
    <Card><CardContent className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-lg font-semibold">Body check</h2><p className="text-xs text-fg-subtle">Private photos, read by the coach for build, balance and where to focus. Never shared, deleted with your account.</p></div>
        <div className="flex items-center gap-2">
          <ChipGroup>{(["front", "side", "back"] as const).map((p) => <Chip key={p} className="h-8 px-3 text-xs capitalize" selected={pose === p} onClick={() => setPose(p)}>{p}</Chip>)}</ChipGroup>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
          <Button size="sm" variant="secondary" loading={busy === "upload"} onClick={() => fileRef.current?.click()}><Camera /> Add photo</Button>
        </div>
      </div>
      {photos.length ? (
        <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">{photos.map((p) => (
          <li key={p.id} className="relative shrink-0">
            <button type="button" onClick={() => setSelected((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })} aria-pressed={selected.has(p.id)} className={cn("block overflow-hidden rounded-xl border-2", selected.has(p.id) ? "border-ember" : "border-transparent")}>
              <img src={`/api/photos/${p.id}`} alt={`${p.pose} photo ${p.takenOn}`} className="h-32 w-24 object-cover" />
            </button>
            <div className="mt-1 flex items-center justify-between text-2xs text-fg-subtle"><span className="capitalize">{p.pose} · {p.takenOn.slice(5)}</span>{p.analysis ? <ScanLine className="size-3 text-signal" /> : null}</div>
            <button type="button" aria-label="Delete photo" onClick={() => remove(p.id)} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-rose"><Trash2 className="size-3" /></button>
          </li>))}</ul>
      ) : <p className="text-sm text-fg-muted">Add a front, side and back photo in the same light every few weeks. The trend matters more than any single picture.</p>}
      {photos.length ? <div className="flex flex-wrap items-center gap-2"><Button size="sm" onClick={analyse} loading={busy === "analyse"} disabled={!ai || !selected.size}><Sparkles /> Read selected ({selected.size})</Button>{!ai && <span className="text-xs text-fg-subtle">AI coach is off on this server; photos are stored only.</span>}</div> : null}
      {latest ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <CoachPulse label="Read" items={[{ text: latest.summary, tone: "ember" }, ...latest.strengths.map((t) => ({ text: t, tone: "signal" as const })), ...latest.posture.map((t) => ({ text: t, tone: "sky" as const }))]} />
          <div className="flex flex-wrap gap-2"><Badge tone="ember" className="capitalize">{label(latest.build)} build</Badge>{latest.bodyFatRangePct ? <Badge tone="outline">Body fat ~{latest.bodyFatRangePct[0]} to {latest.bodyFatRangePct[1]}%</Badge> : null}</div>
          <div><div className="eyebrow mb-2">Where to focus</div><ul className="grid gap-2 sm:grid-cols-2">{latest.focusAreas.map((f) => <li key={f.muscle} className="rounded-lg bg-surface-2 p-3 text-sm"><span className="font-medium capitalize">{label(f.muscle)}</span>{priorityMuscles.includes(f.muscle) ? <Check className="ml-1 inline size-3.5 text-signal" /> : null}<p className="text-fg-muted">{f.reason}</p></li>)}</ul></div>
          {latest.caveats.length ? <p className="text-xs text-fg-subtle">{latest.caveats.join(" ")}</p> : null}
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => apply("priorityMuscles")} loading={busy === "priorityMuscles"}>Prioritise these in my programme</Button>{latest.bodyFatRangePct ? <Button size="sm" variant="secondary" onClick={() => apply("bodyFat")} loading={busy === "bodyFat"}>Use this body-fat estimate</Button> : null}</div>
          <p className="text-2xs text-fg-subtle">A visual read, not a measurement or a diagnosis. Lighting, clothing and pose change what can be seen.</p>
        </div>
      ) : null}
    </CardContent></Card>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Moon, Sun, Trash2 } from "lucide-react";
import type { TrainingProfile } from "@kettleworth/types";
import { Button, Card, CardContent, Chip, ChipGroup, Field, Input, Segmented, Slider, toast } from "@kettleworth/ui";
import { authClient } from "@/lib/auth-client";

export function SettingsView({ user, profile, aiSummary, providerCount, ai }: { user: { name: string; email: string }; profile: TrainingProfile | null; aiSummary: string | null; providerCount: number; ai: boolean }) {
  const router = useRouter();
  const [theme, setTheme] = useState<"system" | "light" | "dark">("dark");
  const [p, setP] = useState<Partial<TrainingProfile>>(profile ?? {});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  useEffect(() => { try { const t = localStorage.getItem("kw-theme"); if (t === "light" || t === "dark") setTheme(t); } catch {} }, []);
  function applyTheme(t: "system" | "light" | "dark") { setTheme(t); try { if (t === "system") { localStorage.removeItem("kw-theme"); document.documentElement.dataset.theme = "dark"; } else { localStorage.setItem("kw-theme", t); document.documentElement.dataset.theme = t; } } catch {} }
  async function save() { setBusy("save"); const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patch: p }) }); setBusy(null); if (!r.ok) return toast.error("Couldn't save"); toast.success("Profile updated. Regenerate your programme to apply changes."); router.refresh(); }
  async function del() { setBusy("delete"); const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) }); setBusy(null); if (!r.ok) return toast.error("Couldn't delete"); await authClient.signOut(); window.location.href = "/"; }
  const set = (patch: Partial<TrainingProfile>) => setP((x) => ({ ...x, ...patch }));
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="eyebrow">Settings</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{user.name}</h1><p className="text-fg-muted">{user.email}</p></div>
      <Card><CardContent className="space-y-3"><h2 className="font-display text-lg font-semibold">Appearance</h2><Segmented value={theme} onChange={applyTheme} options={[{ value: "dark", label: <span className="flex items-center gap-1.5"><Moon className="size-3.5" /> Iron</span> }, { value: "light", label: <span className="flex items-center gap-1.5"><Sun className="size-3.5" /> Chalk</span> }]} label="Theme" /></CardContent></Card>
      {profile && (
        <Card><CardContent className="space-y-5">
          <div><h2 className="font-display text-lg font-semibold">Training profile</h2>{aiSummary ? <p className="mt-1 text-sm text-fg-muted">{aiSummary}</p> : null}<p className="mt-1 text-xs text-fg-subtle">{ai ? "AI coach: on" : "AI coach: off (no API key on this server; deterministic coaching in use)"}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Units"><Segmented value={p.units ?? "metric"} onChange={(v) => set({ units: v })} options={[{ value: "metric", label: "kg · cm" }, { value: "imperial", label: "lb · ft" }]} label="Units" /></Field>
            <Field label="Days per week"><ChipGroup>{[1, 2, 3, 4, 5, 6, 7].map((d) => <Chip key={d} className="h-8 px-3 text-xs" selected={p.daysPerWeek === d} onClick={() => set({ daysPerWeek: d })}>{d}</Chip>)}</ChipGroup></Field>
            <Field label={`Session length: ${p.sessionMinutes} min`}><Slider aria-label="Session minutes" min={20} max={120} step={5} value={[p.sessionMinutes ?? 60]} onValueChange={([v]) => set({ sessionMinutes: v })} /></Field>
            <Field label="Variety" hint="Steady: same lifts all block. Balanced: anchors fixed, accessories rotate each block. High: rotate every 2 weeks and vary main lifts between blocks."><Segmented value={p.varietyPreference ?? "balanced"} onChange={(v) => set({ varietyPreference: v })} options={[{ value: "steady", label: "Steady" }, { value: "balanced", label: "Balanced" }, { value: "high", label: "High" }]} label="Variety" /></Field>
            <Field label="Weight (kg)"><Input inputMode="decimal" value={p.weightKg ?? ""} onChange={(e) => set({ weightKg: e.target.value ? Number(e.target.value) : undefined })} /></Field>
            <Field label="Primary goal"><ChipGroup>{(["fat_loss", "muscle", "strength", "endurance", "general_health", "sport"] as const).map((g) => <Chip key={g} className="h-8 px-3 text-xs capitalize" selected={p.primaryGoal === g} onClick={() => set({ primaryGoal: g, goals: [...new Set([...(p.goals ?? []), g])] })}>{g.replace("_", " ")}</Chip>)}</ChipGroup></Field>
          </div>
          <div className="flex gap-2"><Button onClick={save} loading={busy === "save"}>Save profile</Button><Button variant="secondary" onClick={() => router.push("/app/onboarding")}>Redo full intake</Button></div>
        </CardContent></Card>
      )}
      <Card><CardContent className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Your data</h2>
        <p className="text-sm text-fg-muted">Export everything we hold about you as JSON, or delete your account. Deleting revokes {providerCount} connected provider{providerCount === 1 ? "" : "s"}, removes all synced health data and cannot be undone.</p>
        <div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><a href="/api/account/export" download><Download /> Export my data</a></Button><Button variant="ghost" onClick={async () => { await authClient.signOut(); window.location.href = "/"; }}><LogOut /> Sign out</Button></div>
        <div className="rounded-lg border border-rose/30 p-4"><div className="mb-2 text-sm font-medium text-rose">Delete account</div><div className="flex flex-wrap items-center gap-2"><Input className="max-w-[200px]" placeholder='Type "DELETE"' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Type DELETE to confirm" /><Button variant="danger" disabled={confirmText !== "DELETE"} loading={busy === "delete"} onClick={del}><Trash2 /> Delete permanently</Button></div></div>
      </CardContent></Card>
    </div>
  );
}

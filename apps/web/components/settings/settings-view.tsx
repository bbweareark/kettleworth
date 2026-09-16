"use client";
import { BAR_NAMES, BAR_CHOICES_KG, BAR_CHOICES_LB, DEFAULT_BARS_KG, kgToLb, lbToKg, type BarKind } from "@kettleworth/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Moon, Sun, Trash2, Plane, Thermometer, Bandage, Clock, Baby, CircleDot } from "lucide-react";
import type { TrainingProfile } from "@kettleworth/types";
import { Button, Card, CardContent, Chip, ChipGroup, Field, Input, Segmented, Slider, toast } from "@kettleworth/ui";
import { authClient } from "@/lib/auth-client";

export function SettingsView({ user, profile, aiSummary, providerCount, ai }: { user: { name: string; email: string }; profile: TrainingProfile | null; aiSummary: string | null; providerCount: number; ai: boolean }) {
  const router = useRouter();
  const [theme, setTheme] = useState<"system" | "light" | "dark">("dark");
  const [p, setP] = useState<Partial<TrainingProfile>>(profile ?? {});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  useEffect(() => { const m = document.cookie.match(/(?:^|; )kw-theme=(light|dark)/); if (m) setTheme(m[1] as "light" | "dark"); }, []);
  function applyTheme(t: "system" | "light" | "dark") {
    setTheme(t);
    const year = 60 * 60 * 24 * 365;
    document.cookie = t === "system" ? "kw-theme=; path=/; max-age=0; samesite=lax" : `kw-theme=${t}; path=/; max-age=${year}; samesite=lax`;
    document.documentElement.dataset.theme = t === "light" ? "light" : "dark";
  }
  async function save() { setBusy("save"); const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patch: p }) }); setBusy(null); if (!r.ok) return toast.error("Couldn't save"); toast.success("Profile updated. Regenerate your programme to apply changes."); router.refresh(); }
  async function del() { setBusy("delete"); const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) }); setBusy(null); if (!r.ok) return toast.error("Couldn't delete"); await authClient.signOut(); window.location.href = "/"; }
  const set = (patch: Partial<TrainingProfile>) => setP((x) => ({ ...x, ...patch }));
  const rit = p.rituals ?? {};
  const setRit = (patch: Partial<NonNullable<TrainingProfile["rituals"]>>) => set({ rituals: { ...rit, ...patch } });
  const [modeUntil, setModeUntil] = useState("");
  async function lifeMode(mode: TrainingProfile["lifeMode"]["mode"]) {
    setBusy(`mode-${mode}`);
    const r = await fetch("/api/life-mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, until: modeUntil || null }) });
    setBusy(null);
    if (!r.ok) return toast.error("Couldn't change mode");
    set({ lifeMode: { mode, since: new Date().toISOString().slice(0, 10), until: modeUntil || null } });
    toast.success(mode === "normal" ? "Back to the full plan." : `${mode} mode on. Upcoming sessions adjusted.`); router.refresh();
  }
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="eyebrow">Settings</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">{user.name}</h1><p className="text-fg-muted">{user.email}</p></div>
      <Card><CardContent className="space-y-3">
        <div><h2 className="font-display text-lg font-semibold">Bars</h2><p className="text-sm text-fg-muted">Barbell weights are logged as the total, bar included. Set your gym's bars once and the session screen shows the plates to load on each side. Dumbbells are always the number on one dumbbell.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(BAR_NAMES) as BarKind[]).map((kind) => { const imperial = (p.units ?? "metric") === "imperial"; const choices = (imperial ? BAR_CHOICES_LB : BAR_CHOICES_KG)[kind]; const current = p.barWeights?.[kind] ?? DEFAULT_BARS_KG[imperial ? "imperial" : "metric"][kind]; const currentDisp = Math.round((imperial ? kgToLb(current) : current) * 10) / 10; return (
            <Field key={kind} label={BAR_NAMES[kind]}><ChipGroup>{choices.map((c) => <Chip key={c} className="h-8 px-3 text-xs" selected={Math.abs(currentDisp - c) < 0.2} onClick={() => set({ barWeights: { ...(p.barWeights ?? {}), [kind]: imperial ? Math.round(lbToKg(c) * 100) / 100 : c } })}>{c === 0 ? "Not counted" : `${c} ${imperial ? "lb" : "kg"}`}</Chip>)}</ChipGroup></Field>); })}
        </div>
      </CardContent></Card>
      <Card><CardContent className="space-y-3"><h2 className="font-display text-lg font-semibold">Appearance</h2><Segmented value={theme} onChange={applyTheme} options={[{ value: "dark", label: <span className="flex items-center gap-1.5"><Moon className="size-3.5" /> Iron</span> }, { value: "light", label: <span className="flex items-center gap-1.5"><Sun className="size-3.5" /> Chalk</span> }]} label="Theme" /></CardContent></Card>
      {profile && (
        <Card><CardContent className="space-y-5">
          <div><h2 className="font-display text-lg font-semibold">Training profile</h2>{aiSummary ? <p className="mt-1 text-sm text-fg-muted">{aiSummary}</p> : null}<p className="mt-1 text-xs text-fg-subtle">{ai ? "Coach: live" : "Coach: templated on this server"}</p></div>
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
      <Card id="rituals"><CardContent className="space-y-5">
        <div><h2 className="font-display text-lg font-semibold">Rituals</h2><p className="text-sm text-fg-muted">The moments the app shows up. Set them once and the coach keeps them.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Wake time"><Input type="time" value={rit.wakeTime ?? ""} onChange={(e) => setRit({ wakeTime: e.target.value || undefined })} /></Field>
          <Field label="Evening reflection"><Input type="time" value={rit.reflectionTime ?? ""} onChange={(e) => setRit({ reflectionTime: e.target.value || undefined })} /></Field>
          <Field label="Training window"><div className="grid grid-cols-2 gap-2"><Input type="time" value={rit.trainingWindow?.start ?? ""} onChange={(e) => setRit({ trainingWindow: { start: e.target.value, end: rit.trainingWindow?.end ?? "20:00" } })} /><Input type="time" value={rit.trainingWindow?.end ?? ""} onChange={(e) => setRit({ trainingWindow: { start: rit.trainingWindow?.start ?? "06:00", end: e.target.value } })} /></div></Field>
          <Field label="Weigh-in day"><ChipGroup>{DAYS.map((d, i) => <Chip key={d} className="h-8 px-3 text-xs" selected={rit.weighInDay === i} onClick={() => setRit({ weighInDay: rit.weighInDay === i ? undefined : i })}>{d}</Chip>)}</ChipGroup></Field>
          <Field label="Body check day"><ChipGroup>{DAYS.map((d, i) => <Chip key={d} className="h-8 px-3 text-xs" selected={rit.photoDay === i} onClick={() => setRit({ photoDay: rit.photoDay === i ? undefined : i })}>{d}</Chip>)}</ChipGroup></Field>
        </div>
        <Button onClick={save} loading={busy === "save"}>Save rituals</Button>
      </CardContent></Card>
      <Card id="life"><CardContent className="space-y-4">
        <div><h2 className="font-display text-lg font-semibold">Life mode</h2><p className="text-sm text-fg-muted">Life changes; the plan should flex, not break. Current: <span className="font-medium capitalize text-fg">{p.lifeMode?.mode ?? "normal"}</span>{p.lifeMode?.until ? ` until ${p.lifeMode.until}` : ""}.</p></div>
        <div className="grid gap-2 sm:grid-cols-3">{([["travel", Plane, "Travelling", "Bodyweight and band versions"], ["ill", Thermometer, "Ill", "Pause without losing your streak"], ["injured", Bandage, "Injured", "Add the injury below; swaps apply"], ["busy", Clock, "Busy", "Main lifts only, 30 minutes"], ["newborn", Baby, "New parent", "Two short sessions a week"], ["normal", CircleDot, "Back to normal", "Restore the full plan"]] as const).map(([m, I, l, d]) => (
          <button key={m} type="button" onClick={() => lifeMode(m)} disabled={busy?.startsWith("mode")} aria-pressed={(p.lifeMode?.mode ?? "normal") === m} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${(p.lifeMode?.mode ?? "normal") === m ? "border-ember bg-ember-soft" : "border-border hover:border-border-strong"}`}><I className="mt-0.5 size-4 shrink-0 text-ember" /><span><span className="block text-sm font-medium">{l}</span><span className="text-xs text-fg-muted">{d}</span></span></button>))}</div>
        <Field label="Until (optional)" hint="Leave blank for two weeks; you can switch back any time."><Input type="date" value={modeUntil} onChange={(e) => setModeUntil(e.target.value)} className="max-w-[200px]" /></Field>
      </CardContent></Card>
      <Card><CardContent className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Your data</h2>
        <p className="text-sm text-fg-muted">Export everything we hold about you as JSON, or delete your account. Deleting revokes {providerCount} connected provider{providerCount === 1 ? "" : "s"}, removes all synced health data and cannot be undone.</p>
        <div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><a href="/api/account/export" download><Download /> Export my data</a></Button><Button variant="ghost" onClick={async () => { await authClient.signOut(); window.location.href = "/"; }}><LogOut /> Sign out</Button></div>
        <div className="rounded-lg border border-rose/30 p-4"><div className="mb-2 text-sm font-medium text-rose">Delete account</div><div className="flex flex-wrap items-center gap-2"><Input className="max-w-[200px]" placeholder='Type "DELETE"' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Type DELETE to confirm" /><Button variant="danger" disabled={confirmText !== "DELETE"} loading={busy === "delete"} onClick={del}><Trash2 /> Delete permanently</Button></div></div>
      </CardContent></Card>
    </div>
  );
}

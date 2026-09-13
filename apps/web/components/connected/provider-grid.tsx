"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, RefreshCw, Unplug } from "lucide-react";
import type { HealthMetric } from "@kettleworth/types";
import { Badge, Button, Card, CardContent, Dialog, DialogContent, Switch, toast } from "@kettleworth/ui";

type Info = { id: string; displayName: string; kind: "cloud" | "device" | "partner"; metrics: HealthMetric[]; brandColor: string; consentCopy: string; configured: boolean };
type Conn = { provider: string; status: string; enabledMetrics: HealthMetric[]; lastSyncAt: string | null; lastError: string | null; consentGivenAt: string };
const LABEL: Record<string, string> = { steps: "Steps", resting_hr: "Resting HR", hrv: "HRV", sleep_duration: "Sleep", sleep_stages: "Sleep stages", readiness: "Readiness / recovery", strain: "Strain", active_calories: "Active calories", workout: "Workouts", body_weight: "Weight", body_fat: "Body fat", vo2max: "VO2 max", spo2: "SpO2", body_temperature: "Temperature" };

export function ProviderGrid({ catalogue, connected, flash }: { catalogue: Info[]; connected: Conn[]; flash: { connected?: string; error?: string } }) {
  const router = useRouter();
  const [consent, setConsent] = useState<Info | null>(null);
  const [chosen, setChosen] = useState<Set<HealthMetric>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { if (flash.connected) toast.success(`${flash.connected} connected. First sync is running.`); if (flash.error) toast.error(decodeURIComponent(flash.error)); }, [flash]);
  const conn = (id: string) => connected.find((c) => c.provider === id);
  async function connect() {
    if (!consent) return;
    setBusy(consent.id);
    const r = await fetch(`/api/integrations/${consent.id}/connect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metrics: [...chosen] }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Couldn't start connection");
    window.location.href = j.url;
  }
  async function act(id: string, action: "sync" | "disconnect") {
    setBusy(id);
    const r = await fetch(`/api/integrations/${id}/${action}`, { method: "POST" }); const j = await r.json().catch(() => ({})); setBusy(null);
    if (!r.ok) return toast.error(j.error ?? "Failed");
    toast.success(action === "sync" ? `Synced ${j.written ?? 0} new samples` : "Disconnected and synced data deleted"); router.refresh();
  }
  async function toggle(id: string, metrics: HealthMetric[]) { await fetch(`/api/integrations/${id}/metrics`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metrics }) }); router.refresh(); }
  const cloud = catalogue.filter((c) => c.kind === "cloud"), device = catalogue.filter((c) => c.kind !== "cloud");
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cloud.map((p) => { const c = conn(p.id); return (
          <Card key={p.id}><CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-3"><span className="size-3 rounded-full" style={{ background: p.brandColor }} aria-hidden /><span className="font-medium">{p.displayName}</span>{c ? <Badge tone={c.status === "connected" ? "signal" : "amber"} className="ml-auto">{c.status}</Badge> : !p.configured ? <Badge tone="neutral" className="ml-auto">Not configured</Badge> : null}</div>
            {c ? (<>
              <div className="text-xs text-fg-subtle">{c.lastSyncAt ? `Synced ${new Date(c.lastSyncAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Not synced yet"}{c.lastError ? <span className="block text-rose">{c.lastError}</span> : null}</div>
              <details className="text-sm"><summary className="cursor-pointer text-fg-muted">Data types ({c.enabledMetrics.length}/{p.metrics.length})</summary><ul className="mt-2 space-y-1.5">{p.metrics.map((m) => <li key={m} className="flex items-center justify-between"><span>{LABEL[m] ?? m}</span><Switch checked={c.enabledMetrics.includes(m)} onCheckedChange={(on) => toggle(p.id, on ? [...c.enabledMetrics, m] : c.enabledMetrics.filter((x) => x !== m))} aria-label={`${LABEL[m]} from ${p.displayName}`} /></li>)}</ul></details>
              <div className="flex gap-2"><Button size="sm" variant="secondary" loading={busy === p.id} onClick={() => act(p.id, "sync")}><RefreshCw /> Sync</Button><Button size="sm" variant="danger" onClick={() => { if (confirm(`Disconnect ${p.displayName} and delete all data synced from it?`)) act(p.id, "disconnect"); }}><Unplug /> Disconnect</Button></div>
            </>) : (<>
              <p className="text-xs text-fg-muted">{p.metrics.slice(0, 5).map((m) => LABEL[m]).join(", ")}{p.metrics.length > 5 ? "…" : ""}</p>
              <Button size="sm" disabled={!p.configured} onClick={() => { setConsent(p); setChosen(new Set(p.metrics)); }}><Link2 /> Connect</Button>
              {!p.configured && <p className="text-2xs text-fg-subtle">Add {p.id.toUpperCase()}_CLIENT_ID and secret to the server to enable.</p>}
            </>)}
          </CardContent></Card>); })}
      </div>
      <div><div className="eyebrow mb-2">On your phone</div><div className="flex flex-wrap gap-2">{device.map((p) => <Badge key={p.id} tone="outline" className="normal-case tracking-normal"><span className="size-2 rounded-full" style={{ background: p.brandColor }} />{p.displayName} · mobile app</Badge>)}</div></div>
      <Dialog open={!!consent} onOpenChange={(o) => !o && setConsent(null)}>
        {consent && (<DialogContent title={`Connect ${consent.displayName}`} description={consent.consentCopy}>
          <ul className="mb-4 space-y-2">{consent.metrics.map((m) => <li key={m} className="flex items-center justify-between text-sm"><span>{LABEL[m] ?? m}</span><Switch checked={chosen.has(m)} onCheckedChange={(on) => setChosen((s) => { const n = new Set(s); on ? n.add(m) : n.delete(m); return n; })} aria-label={LABEL[m]} /></li>)}</ul>
          <p className="mb-4 text-xs text-fg-subtle">You'll be sent to {consent.displayName} to approve access. We store only the data types you keep on, encrypted. Disconnect any time to delete it.</p>
          <Button className="w-full" onClick={connect} loading={busy === consent.id} disabled={chosen.size === 0}>Continue to {consent.displayName}</Button>
        </DialogContent>)}
      </Dialog>
    </div>
  );
}

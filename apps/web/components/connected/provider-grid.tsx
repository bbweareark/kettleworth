"use client";
import { LocalDateTime } from "@/lib/format";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, RefreshCw, Unplug } from "lucide-react";
import type { HealthMetric } from "@kettleworth/types";
import { Button, Dialog, DialogContent, Switch, toast } from "@kettleworth/ui";

/**
 * The providers, as an index rather than a wall of cards.
 *
 * What was here: six bordered cards in a grid, each with a coloured dot, a status badge, a
 * grey run of metric names, and - for every provider whose keys are not on this server - a
 * red block reading "Add WHOOP_CLIENT_ID and secret to the server to enable". Six red blocks
 * shouting a deployment detail at a member who only wanted to connect a watch, and in Arc,
 * where red means impact, it read as six failures.
 *
 * Now: one hairline row per provider, the brand colour as a bar at the left rather than a
 * dot, the name at display size, the facts on one line, and the action at the right. What the
 * server is missing is said once, quietly, at the bottom, because it is true of the server and
 * not of the member.
 */
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

  const cloud = catalogue.filter((c) => c.kind === "cloud");
  const device = catalogue.filter((c) => c.kind !== "cloud");
  const unconfigured = cloud.filter((p) => !p.configured && !conn(p.id));

  return (
    <div className="space-y-6">
      <ol className="border-t border-rule">
        {cloud.map((p) => {
          const c = conn(p.id);
          const off = !p.configured && !c;
          return (
            <li key={p.id} className="flex items-start gap-3 border-b border-rule py-4">
              {/* The brand colour as a bar running the height of the row, not a dot in a box. */}
              <span aria-hidden className="mt-1 h-10 w-1 shrink-0" style={{ background: p.brandColor, opacity: off ? 0.35 : 1 }} />

              <div className="min-w-0 flex-1">
                <p className={`font-display text-2xl leading-none tracking-tightest ${off ? "text-fg-subtle" : ""}`}>{p.displayName}</p>
                <p className="meta mt-1.5 truncate">
                  {c
                    ? <>{c.status}{c.lastSyncAt ? <> · synced <LocalDateTime iso={c.lastSyncAt} /></> : " · not synced yet"}</>
                    : p.metrics.slice(0, 4).map((m) => LABEL[m]).join(" · ")}
                </p>
                {c?.lastError ? <p className="mt-1 text-xs text-volt">{c.lastError}</p> : null}

                {c ? (
                  <details className="mt-3 text-sm">
                    <summary className="meta cursor-pointer transition-colors hover:text-fg">Data types, {c.enabledMetrics.length} of {p.metrics.length} on</summary>
                    <ul className="mt-3 space-y-2 border-t border-rule pt-3">
                      {p.metrics.map((m) => (
                        <li key={m} className="flex items-center justify-between gap-4">
                          <span>{LABEL[m] ?? m}</span>
                          <Switch checked={c.enabledMetrics.includes(m)} onCheckedChange={(on) => toggle(p.id, on ? [...c.enabledMetrics, m] : c.enabledMetrics.filter((x) => x !== m))} aria-label={`${LABEL[m]} from ${p.displayName}`} />
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" loading={busy === p.id} onClick={() => act(p.id, "sync")}><RefreshCw /> Sync now</Button>
                      <Button size="sm" variant="danger" onClick={() => { if (confirm(`Disconnect ${p.displayName} and delete all data synced from it?`)) act(p.id, "disconnect"); }}><Unplug /> Disconnect</Button>
                    </div>
                  </details>
                ) : null}
              </div>

              {!c ? (
                <Button size="sm" variant={off ? "ghost" : "secondary"} disabled={off} onClick={() => { setConsent(p); setChosen(new Set(p.metrics)); }}>
                  <Link2 /> {off ? "Unavailable" : "Connect"}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div>
        <p className="meta mb-2">On your phone</p>
        <p className="measure text-sm text-fg-muted">{device.map((p) => p.displayName).join(", ")} connect through the Kettleworth mobile app, because that data lives on the device.</p>
      </div>

      {/* Said once, about the server, instead of once per provider in red. */}
      {unconfigured.length ? (
        <p className="measure text-xs text-fg-subtle">
          {unconfigured.map((p) => p.displayName).join(", ")} {unconfigured.length === 1 ? "needs its API keys" : "need their API keys"} on this server before {unconfigured.length === 1 ? "it" : "they"} can be connected.
        </p>
      ) : null}

      <Dialog open={!!consent} onOpenChange={(o) => !o && setConsent(null)}>
        {consent && (<DialogContent title={`Connect ${consent.displayName}`} description={consent.consentCopy}>
          <ul className="mb-4 space-y-2">{consent.metrics.map((m) => <li key={m} className="flex items-center justify-between text-sm"><span>{LABEL[m] ?? m}</span><Switch checked={chosen.has(m)} onCheckedChange={(on) => setChosen((s) => { const n = new Set(s); if (on) n.add(m); else n.delete(m); return n; })} aria-label={LABEL[m]} /></li>)}</ul>
          <p className="mb-4 text-xs text-fg-subtle">You&apos;ll be sent to {consent.displayName} to approve access. We store only the data types you keep on, encrypted. Disconnect any time to delete it.</p>
          <Button className="w-full" onClick={connect} loading={busy === consent.id} disabled={chosen.size === 0}>Continue to {consent.displayName}</Button>
        </DialogContent>)}
      </Dialog>
    </div>
  );
}

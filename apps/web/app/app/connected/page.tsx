import { Smartphone } from "lucide-react";
import { requireUser } from "@/lib/session";
import { providerCatalogue, connectedProviders, getReadiness, recentSamples } from "@kettleworth/api";
import { Card, CardContent, Ring, Badge } from "@kettleworth/ui";
import { ProviderGrid } from "@/components/connected/provider-grid";

export const metadata = { title: "Connected apps" };
export const dynamic = "force-dynamic";

export default async function Connected({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [catalogue, connected, readiness, samples] = await Promise.all([providerCatalogue(), connectedProviders(user.id), getReadiness(user.id), recentSamples(user.id, 3)]);
  const latest = (m: string) => samples.find((s) => s.metric === m);
  return (
    <div className="space-y-6">
      <div><p className="eyebrow">Connected apps</p><h1 className="font-display text-3xl font-semibold tracking-tighter md:text-4xl">Let your recovery shape the plan.</h1><p className="mt-2 max-w-2xl text-fg-muted">Connect a wearable and Kettleworth reads sleep, HRV and readiness to ease or push each session. You choose exactly which data types we read, and one tap disconnects and deletes everything synced.</p></div>
      <Card><CardContent className="flex flex-wrap items-center gap-6">
        <Ring value={readiness.score != null ? readiness.score / 100 : 0} size={112} stroke={10} tone={readiness.band === "high" ? "signal" : readiness.band === "moderate" ? "amber" : readiness.band === "low" ? "rose" : "sky"} label={`Readiness ${readiness.score ?? "unknown"}`}><div className="text-center"><div className="font-display text-2xl font-semibold tabular">{readiness.score ?? "-"}</div><div className="text-2xs uppercase text-fg-subtle">Today</div></div></Ring>
        <div className="flex-1 space-y-1 text-sm"><div className="flex flex-wrap gap-2">{["sleep_duration", "hrv", "resting_hr", "steps"].map((m) => { const s = latest(m); return <Badge key={m} tone={s ? "signal" : "neutral"} className="normal-case tracking-normal">{m.replace("_", " ")}: {s ? `${m === "sleep_duration" ? (s.value! / 60).toFixed(1) + " h" : Math.round(s.value ?? 0) + " " + s.unit}` : "no data"}</Badge>; })}</div><p className="text-fg-muted">{readiness.reasons.join(" ")}</p></div>
      </CardContent></Card>
      <ProviderGrid catalogue={catalogue} connected={connected.map((c) => ({ ...c, lastSyncAt: c.lastSyncAt?.toISOString() ?? null, consentGivenAt: c.consentGivenAt.toISOString() }))} flash={sp} />
      <Card><CardContent className="flex items-start gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2"><Smartphone className="size-5 text-fg-muted" /></div><div><h3 className="font-display text-lg font-semibold">Sync from your phone</h3><p className="text-sm text-fg-muted">Apple Health, Google Health Connect and Samsung Health live on the device, so they connect through the Kettleworth mobile app (coming next). Every provider maps into the same health model, so your priorities and toggles carry across.</p></div></CardContent></Card>
      <p className="text-xs text-fg-subtle">Health data is encrypted at rest, never used for advertising and never sold. Kettleworth follows Apple HealthKit and Google Health Connect data policies.</p>
    </div>
  );
}

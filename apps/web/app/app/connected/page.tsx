import { Smartphone } from "lucide-react";
import { requireUser } from "@/lib/session";
import { providerCatalogue, connectedProviders, getReadiness, recentSamples } from "@kettleworth/api";
import { Readout, ReadoutRow } from "@kettleworth/ui";
import { ProviderGrid } from "@/components/connected/provider-grid";
import { Screen } from "@/components/app/screen";
import { ScreenHero } from "@/components/app/hero";
import { Panel } from "@/components/app/panel";
import { ART } from "@/lib/art";

export const metadata = { title: "Connected apps" };
export const dynamic = "force-dynamic";

export default async function Connected({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [catalogue, connected, readiness, samples] = await Promise.all([providerCatalogue(), connectedProviders(user.id), getReadiness(user.id), recentSamples(user.id, 3)]);
  const latest = (m: string) => samples.find((s) => s.metric === m);
  const sleep = latest("sleep_duration");
  const hrv = latest("hrv");
  const rhr = latest("resting_hr");
  const steps = latest("steps");

  // The one number: readiness, because that is the only thing a connected wearable changes
  // about this app. Everything else on the screen is plumbing for it.
  return (
    <>
      <ScreenHero
        art={ART.connected}
        priority
        eyebrow="Connected apps"
        label="Readiness today"
        value={readiness.score ?? "–"}
        second={readiness.score != null ? `${readiness.band} band.` : "No recovery signal yet."}
      >
        <p className="measure mt-3 text-sm text-fg-muted">{readiness.reasons.length ? readiness.reasons.join(" ") : "Sleep, HRV and readiness ease or push each session. You choose the data types; one tap disconnects and deletes."}</p>
      </ScreenHero>

      <Screen flush className="pt-10">

        <ReadoutRow className="border-t-0 pt-0">
          <Readout label="Sleep" value={sleep?.value != null ? (sleep.value / 60).toFixed(1) : "–"} unit={sleep?.value != null ? "h" : undefined} />
          <Readout label="HRV" value={hrv?.value != null ? Math.round(hrv.value) : "–"} unit={hrv?.value != null ? hrv.unit : undefined} />
          <Readout label="Resting HR" value={rhr?.value != null ? Math.round(rhr.value) : "–"} unit={rhr?.value != null ? rhr.unit : undefined} />
          <Readout label="Steps" value={steps?.value != null ? Math.round(steps.value) : "–"} />
        </ReadoutRow>

        <ProviderGrid catalogue={catalogue} connected={connected.map((c) => ({ ...c, lastSyncAt: c.lastSyncAt?.toISOString() ?? null, consentGivenAt: c.consentGivenAt.toISOString() }))} flash={sp} />

        <Panel title="Sync from your phone">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-full border border-rule text-fg-muted">
              <Smartphone className="size-5" aria-hidden />
            </div>
            <p className="measure text-sm text-fg-muted">Apple Health, Google Health Connect and Samsung Health live on the device, so they connect through the Kettleworth mobile app. Every provider maps into the same health model, so your priorities and toggles carry across.</p>
          </div>
        </Panel>

        <p className="measure text-xs text-fg-subtle">Health data is encrypted at rest, never used for advertising and never sold. Kettleworth follows Apple HealthKit and Google Health Connect data policies.</p>
        </Screen>
    </>
  );
}

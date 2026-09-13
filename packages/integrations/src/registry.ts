import type { HealthProvider } from "@kettleworth/types";
import type { ProviderAdapter } from "./adapter";
import { oura } from "./adapters/oura";
import { whoop } from "./adapters/whoop";
import { strava } from "./adapters/strava";
import { fitbit } from "./adapters/fitbit";
import { garmin } from "./adapters/garmin";
import { polar } from "./adapters/polar";
import { appleHealth, healthConnect, samsungHealth, coros } from "./adapters/device";

export const PROVIDERS: Record<Exclude<HealthProvider, "manual">, ProviderAdapter> = {
  whoop, oura, garmin, fitbit, strava, polar, apple_health: appleHealth, health_connect: healthConnect, samsung_health: samsungHealth, coros,
};
export function getProvider(id: string): ProviderAdapter | null {
  return (PROVIDERS as Record<string, ProviderAdapter>)[id] ?? null;
}
export function listProviders(): (ProviderAdapter["info"] & { configured: boolean })[] {
  return Object.values(PROVIDERS).map((p) => ({ ...p.info, configured: p.configured() }));
}

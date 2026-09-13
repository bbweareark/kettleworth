import type { ProviderAdapter } from "../adapter";

/** Phone-local sources. Wired in the mobile app (Phase 3); on web they explain themselves. */
function device(id: ProviderAdapter["info"]["id"], displayName: string, brandColor: string, docsUrl: string, kind: "device" | "partner" = "device"): ProviderAdapter {
  return {
    info: { id, displayName, kind, brandColor, docsUrl, metrics: ["steps", "resting_hr", "hrv", "sleep_duration", "sleep_stages", "active_calories", "workout", "body_weight", "vo2max", "spo2"], consentCopy: `${displayName} data is read on your phone with the Kettleworth mobile app and synced with your explicit per-category permission.` },
    configured: () => false,
    authUrl: () => { throw new Error(`${displayName} connects from the mobile app`); },
    exchangeCode: async () => { throw new Error(`${displayName} connects from the mobile app`); },
    refresh: async (c) => c,
    fetchSamples: async (creds) => ({ samples: [], creds }),
  };
}
export const appleHealth = device("apple_health", "Apple Health", "#ff2d55", "https://developer.apple.com/health-fitness/");
export const healthConnect = device("health_connect", "Google Health Connect", "#4285f4", "https://developer.android.com/health-and-fitness/guides/health-connect");
export const samsungHealth = device("samsung_health", "Samsung Health", "#1428a0", "https://developer.samsung.com/health");
export const coros = device("coros", "Coros", "#e11a22", "https://coros.com", "partner");

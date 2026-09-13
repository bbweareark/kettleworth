import type { HealthMetric, HealthProvider, HealthSample } from "@kettleworth/types";

export type Credentials = { accessToken: string; refreshToken?: string | null; expiresAt?: string | null; scope?: string | null; providerUserId?: string | null; extra?: Record<string, unknown> };

export type ProviderInfo = {
  id: HealthProvider;
  displayName: string;
  /** cloud = OAuth API usable from the web app; device = phone-local SDK, mobile phase; partner = requires partner programme */
  kind: "cloud" | "device" | "partner";
  metrics: HealthMetric[];
  brandColor: string;
  docsUrl: string;
  /** Human sentence explaining what we read and why. Shown on the consent screen. */
  consentCopy: string;
};

export interface ProviderAdapter {
  info: ProviderInfo;
  /** True when the server has the client id/secret for this provider. */
  configured(): boolean;
  authUrl(params: { redirectUri: string; state: string; codeChallenge?: string }): string;
  exchangeCode(params: { code: string; redirectUri: string; codeVerifier?: string }): Promise<Credentials>;
  refresh(creds: Credentials): Promise<Credentials>;
  /** Pull normalised samples since a timestamp. Must include a raw payload per sample for auditability. */
  fetchSamples(creds: Credentials, since: Date, metrics: HealthMetric[]): Promise<{ samples: (HealthSample & { raw: unknown })[]; creds: Credentials }>;
  /** Best-effort token revocation on disconnect. */
  revoke?(creds: Credentials): Promise<void>;
  /** Webhook verification + parsing when the provider pushes. */
  parseWebhook?(headers: Record<string, string>, body: string): { userRef: string; metrics: HealthMetric[] } | null;
}

export const env = (k: string) => process.env[k] ?? "";
export const iso = (d: Date | string | number) => new Date(d).toISOString();
export function usesPkce(id: HealthProvider): boolean { return id === "garmin" || id === "fitbit"; }

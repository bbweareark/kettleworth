import { createHash, randomBytes } from "node:crypto";
import type { Credentials } from "./adapter";

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
export const randomState = () => randomBytes(24).toString("base64url");

export async function tokenRequest(url: string, body: Record<string, string>, opts: { basicAuth?: [string, string] } = {}): Promise<Credentials> {
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  if (opts.basicAuth) headers.Authorization = "Basic " + Buffer.from(opts.basicAuth.join(":")).toString("base64");
  const res = await fetch(url, { method: "POST", headers, body: new URLSearchParams(body) });
  if (!res.ok) throw new Error(`Token request failed (${res.status}): ${await res.text()}`);
  const j = (await res.json()) as Record<string, unknown>;
  const expiresIn = typeof j.expires_in === "number" ? j.expires_in : null;
  return {
    accessToken: String(j.access_token),
    refreshToken: (j.refresh_token as string | undefined) ?? null,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    scope: (j.scope as string | undefined) ?? null,
    providerUserId: (j.user_id as string | undefined) ?? (j.athlete as { id?: number } | undefined)?.id?.toString() ?? (j.x_user_id as string | undefined) ?? null,
    extra: j,
  };
}
export function isExpired(creds: Credentials, skewSeconds = 60): boolean {
  return !!creds.expiresAt && new Date(creds.expiresAt).getTime() - skewSeconds * 1000 < Date.now();
}
export async function getJson<T>(url: string, token: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...headers } });
  if (!res.ok) throw new Error(`GET ${url} failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as T;
}
export const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

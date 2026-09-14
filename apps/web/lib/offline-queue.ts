"use client";
import { get, set, del, keys } from "idb-keyval";

/** Offline-tolerant logging: every set log is queued in IndexedDB first, then flushed. Replays are idempotent (setNumber upsert server-side). */
type Job = { url: string; body: unknown; at: number };
const PREFIX = "kw-queue:";
export async function enqueue(url: string, body: unknown): Promise<string> {
  const id = `${PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await set(id, { url, body, at: Date.now() } satisfies Job);
  try { const reg = await navigator.serviceWorker?.ready; await (reg as unknown as { sync?: { register: (t: string) => Promise<void> } }).sync?.register("kw-flush"); } catch {}
  return id;
}
export async function flush(): Promise<{ sent: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { sent: 0, failed: 0 };
  const ks = (await keys()).filter((k) => typeof k === "string" && k.startsWith(PREFIX)).sort() as string[];
  let sent = 0, failed = 0;
  for (const k of ks) {
    const job = await get<Job>(k);
    if (!job) continue;
    try {
      const r = await fetch(job.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(job.body) });
      if (r.ok || r.status === 400 || r.status === 409) { await del(k); sent++; } else failed++;
    } catch { failed++; break; }
  }
  return { sent, failed };
}
export async function pending(): Promise<number> {
  return (await keys()).filter((k) => typeof k === "string" && k.startsWith(PREFIX)).length;
}
/** Try immediately; fall back to the queue when offline or the request fails. */
export async function postResilient<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; queued: true } | { ok: false; needsConfirmation: true; reason: string }> {
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) return { ok: true, data: (await r.json()) as T };
      if (r.status === 409) return { ok: false, needsConfirmation: true, reason: ((await r.json()) as { error?: string }).error ?? "Unusual value" };
      if (r.status === 400 || r.status === 401) throw new Error((await r.json()).error ?? "Request failed");
    } catch (e) { if (e instanceof Error && /Request failed|Unauthorised|Invalid/.test(e.message)) throw e; }
  }
  await enqueue(url, body);
  return { ok: false, queued: true };
}

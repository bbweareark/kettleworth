import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global { interface WorkerGlobalScope extends SerwistGlobalConfig { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined; } }
declare const self: ServiceWorkerGlobalScope;

/**
 * Offline strategy for a gym with no signal:
 * - App pages: network first, fall back to the last copy (so an opened session keeps working).
 * - Brand art and exercise stills: cache first, long lived.
 * - Library search and exercise pages: stale-while-revalidate.
 * - Writes are never cached here; the session player queues them in IndexedDB and replays when online.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    { matcher: ({ request, url }) => request.mode === "navigate" && url.pathname.startsWith("/app"), handler: new NetworkFirst({ cacheName: "kw-app-pages", networkTimeoutSeconds: 4, plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 3600 })] }) },
    { matcher: ({ url }) => url.pathname.startsWith("/art/") || url.hostname === "raw.githubusercontent.com" || url.hostname === "i.ytimg.com", handler: new CacheFirst({ cacheName: "kw-images", plugins: [new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: 30 * 24 * 3600 })] }) },
    { matcher: ({ url }) => url.pathname.startsWith("/api/library") || url.pathname.startsWith("/library"), handler: new StaleWhileRevalidate({ cacheName: "kw-library", plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 7 * 24 * 3600 })] }) },
    { matcher: ({ url, request }) => request.method === "GET" && (url.pathname.startsWith("/api/photos/") || url.pathname.startsWith("/api/activity")), handler: new NetworkFirst({ cacheName: "kw-api", networkTimeoutSeconds: 4, plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 3600 })] }) },
    ...defaultCache,
  ],
  fallbacks: { entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }] },
});
serwist.addEventListeners();

// Replay queued writes as soon as connectivity returns (the page also flushes; this covers a backgrounded tab).
self.addEventListener("sync", (event) => { if ((event as { tag?: string }).tag === "kw-flush") (event as ExtendableEvent).waitUntil(self.clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage({ type: "kw-flush" })))); });

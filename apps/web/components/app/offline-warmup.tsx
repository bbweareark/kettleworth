"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { flush, pending } from "@/lib/offline-queue";

/**
 * Keeps today's session usable without signal: warms the service-worker cache with the session page and its images,
 * flushes queued writes when the connection returns, and shows a quiet offline indicator.
 */
/** The browser's own online flag, read as the external store it is. */
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
}

export function OfflineWarmup({ sessionHref, images }: { sessionHref: string | null; images: string[] }) {
  const offline = useSyncExternalStore(subscribeOnline, () => !navigator.onLine, () => false);
  const [queued, setQueued] = useState(0);
  useEffect(() => {
    const on = () => { flush().then(() => pending().then(setQueued)); };
    window.addEventListener("online", on);
    pending().then(setQueued);
    navigator.serviceWorker?.addEventListener("message", (e) => { if (e.data?.type === "kw-flush") on(); });
    /*
     * Warming the cache used to fire thirteen requests in parallel the moment the service
     * worker was ready - every single time Today loaded - competing with the page that was
     * still trying to become interactive. It is a background nicety, so it now waits for the
     * browser to be idle, goes three at a time, and does not run at all for someone on a
     * metered or slow connection, who is exactly the person it would hurt most.
     */
    const warm = async () => {
      if (!navigator.onLine || !("caches" in window)) return;
      const c = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (c?.saveData || (c?.effectiveType && /^(slow-)?2g$/.test(c.effectiveType))) return;
      try {
        const cache = await caches.open("kw-warm");
        const urls = [sessionHref, ...images.slice(0, 12)].filter((u): u is string => !!u);
        for (let i = 0; i < urls.length; i += 3) {
          await Promise.all(urls.slice(i, i + 3).map((u) => cache.add(u).catch(() => {})));
        }
      } catch {}
    };
    const idle = (fn: () => void) => {
      const ric = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      return ric ? ric(fn, { timeout: 8000 }) : window.setTimeout(fn, 3000);
    };
    let scheduled = 0;
    const start = () => { scheduled = idle(() => { void warm(); }); };
    if (navigator.serviceWorker?.controller) start(); else navigator.serviceWorker?.ready.then(start).catch(() => {});
    return () => {
      window.removeEventListener("online", on);
      const cic = (window as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (scheduled) { if (cic) cic(scheduled); else clearTimeout(scheduled); }
    };
  }, [sessionHref, images]);
  if (!offline && !queued) return null;
  return <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] left-1/2 z-40 -translate-x-1/2 border border-rule bg-bg-elevated/90 px-3 py-1.5 text-xs text-fg-muted shadow-pop lg:bottom-4" role="status"><WifiOff className="mr-1.5 inline size-3.5 text-volt" />{offline ? "Offline: logging saves on this device" : `${queued} change${queued > 1 ? "s" : ""} waiting to sync`}</div>;
}

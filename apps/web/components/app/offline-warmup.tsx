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
    const warm = async () => {
      if (!navigator.onLine || !("caches" in window)) return;
      try {
        const cache = await caches.open("kw-warm");
        const urls = [sessionHref, ...images.slice(0, 12)].filter((u): u is string => !!u);
        await Promise.all(urls.map((u) => cache.add(u).catch(() => {})));
      } catch {}
    };
    if (navigator.serviceWorker?.controller) warm(); else navigator.serviceWorker?.ready.then(warm).catch(() => {});
    return () => { window.removeEventListener("online", on); };
  }, [sessionHref, images]);
  if (!offline && !queued) return null;
  return <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] left-1/2 z-40 -translate-x-1/2 border border-rule bg-bg-elevated/90 px-3 py-1.5 text-xs text-fg-muted shadow-pop lg:bottom-4" role="status"><WifiOff className="mr-1.5 inline size-3.5 text-volt" />{offline ? "Offline: logging saves on this device" : `${queued} change${queued > 1 ? "s" : ""} waiting to sync`}</div>;
}

"use client";
import { useNow } from "@/lib/use-now";

export function ElapsedClock({ since }: { since: string | null }) {
  const now = useNow(1000);
  if (!since) return null;
  if (now == null) return <span className="font-mono tabular text-fg-subtle">0:00</span>;
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  return <span className="font-mono tabular text-fg-subtle">{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</span>;
}

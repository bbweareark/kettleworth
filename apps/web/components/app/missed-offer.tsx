"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { toast } from "@kettleworth/ui";

/** A missed session on a free day: fit it in now, or let it go so it stops following you around. */
export function MissedOffer({ id, name, when, nextLabel }: { id: string; name: string; when: string; nextLabel: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
  if (gone) return null;
  async function letGo() {
    setBusy(true);
    const r = await fetch(`/api/session/${id}/skip`, { method: "POST" });
    setBusy(false);
    if (!r.ok) return toast.error("Couldn't update that");
    setGone(true); toast.message(`${name} skipped. It comes round again next week.`); router.refresh();
  }
  return (
    <div className="rounded-2xl bg-black/40 p-4 ring-1 ring-amber/25 backdrop-blur">
      <p className="text-2xs uppercase tracking-[0.16em] text-amber">Missed {when}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-white">{name}</p>
      <p className="mt-1 text-sm text-white/70">Today is free, so you can fit it in{nextLabel ? ` before ${nextLabel}` : ""}. Or let it go and stay on schedule.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href={`/app/session/${id}?start=1`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-fg px-4 text-sm font-semibold text-bg active:scale-[0.98]"><Play className="size-4" /> Train it today</Link>
        <button type="button" disabled={busy} onClick={letGo} className="inline-flex h-10 items-center rounded-lg px-3 text-sm text-white/70 ring-1 ring-white/15 hover:text-white disabled:opacity-50">{busy ? "Skipping..." : "Skip it"}</button>
      </div>
    </div>
  );
}

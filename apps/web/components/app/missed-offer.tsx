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
    <div className="rounded-lg border border-volt bg-surface p-4">
      <p className="meta text-volt">Missed {when}</p>
      <p className="mt-1 font-display text-xl">{name}</p>
      <p className="measure mt-1 text-sm text-fg-muted">Today is free, so you can fit it in{nextLabel ? ` before ${nextLabel}` : ""}. Or let it go and stay on schedule.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href={`/app/session/${id}?start=1`} className="inline-flex h-11 items-center gap-2 rounded-full bg-volt px-5 text-sm text-volt-fg transition-colors hover:bg-volt-hover"><Play className="size-4" /> Train it today</Link>
        <button type="button" disabled={busy} onClick={letGo} className="inline-flex h-11 items-center rounded-full border border-rule-strong px-4 text-sm text-fg-muted transition-colors hover:border-fg hover:text-fg disabled:opacity-50">{busy ? "Skipping..." : "Skip it"}</button>
      </div>
    </div>
  );
}

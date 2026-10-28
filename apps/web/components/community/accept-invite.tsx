"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import { Button, toast } from "@kettleworth/ui";

export function AcceptInvite({ token, name, handle }: { token: string; name: string; handle: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function accept() {
    setBusy(true);
    const r = await fetch("/api/community/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast.error(j.error ?? "Couldn't accept that invite");
    setDone(true);
    toast.success(`You and ${name} are training partners.`);
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-lg border border-volt bg-surface p-5">
        <p className="meta text-volt">Done</p>
        <p className="mt-1 font-display text-xl">You and {name} are partners.</p>
        <Button asChild className="mt-4"><Link href="/app/community">Open Community <Check /></Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xl" onClick={accept} loading={busy}>Train with {name} <UserPlus /></Button>
      <Button asChild size="xl" variant="ghost"><Link href="/app">Not now</Link></Button>
      <p className="meta w-full">@{handle}</p>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, toast } from "@kettleworth/ui";
import { lbToKg } from "@kettleworth/core";
export function MeasurementForm({ units }: { units: "metric" | "imperial" }) {
  const router = useRouter();
  const [w, setW] = useState(""); const [bf, setBf] = useState(""); const [sleep, setSleep] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const r = await fetch("/api/measurements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ measuredOn: new Date().toISOString().slice(0, 10), weightKg: w ? (units === "metric" ? Number(w) : lbToKg(Number(w))) : null, bodyFatPct: bf ? Number(bf) : null, sleepHours: sleep ? Number(sleep) : null }) });
    setBusy(false);
    if (!r.ok) return toast.error("Couldn't save");
    toast.success("Logged"); setW(""); setBf(""); setSleep(""); router.refresh();
  }
  return (
    <form onSubmit={submit} className="mt-4 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
      <label className="text-xs text-fg-subtle">Weight ({units === "metric" ? "kg" : "lb"})<Input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} className="mt-1 h-9" /></label>
      <label className="text-xs text-fg-subtle">Body fat %<Input inputMode="decimal" value={bf} onChange={(e) => setBf(e.target.value)} className="mt-1 h-9" /></label>
      <label className="text-xs text-fg-subtle">Sleep last night (h)<Input inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)} className="mt-1 h-9" /></label>
      <Button type="submit" size="sm" loading={busy} disabled={!w && !bf && !sleep}>Log</Button>
    </form>
  );
}

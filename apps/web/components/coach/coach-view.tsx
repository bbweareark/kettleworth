"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Mail, Send, Sparkles, Check, X } from "lucide-react";
import { Button, Textarea, Badge, CoachPulse, cn, toast } from "@kettleworth/ui";

type Letter = { id: string; weekStartsOn: string; headline: string; body: string; adaptations: { kind: string; reason: string }[]; readAt: string | null; generatedBy: string };
type Msg = { id: string; role: "user" | "coach"; content: string; actions: { type: string; summary: string; applied: boolean }[]; at: string };

export function CoachView({ letters, history, ai, name }: { letters: Letter[]; history: Msg[]; ai: boolean; name: string }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState(history);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState(false);
  const [open, setOpen] = useState<string | null>(letters[0]?.id ?? null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);
  useEffect(() => { const l = letters.find((x) => x.id === open); if (l && !l.readAt) fetch("/api/coach/letters/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: l.id }) }).catch(() => {}); }, [open, letters]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const m = text.trim(); if (!m || busy) return;
    setBusy(true); setText("");
    setMsgs((x) => [...x, { id: `tmp-${Date.now()}`, role: "user", content: m, actions: [], at: new Date().toISOString() }]);
    const r = await fetch("/api/coach/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return toast.error(j.error ?? "Couldn't reach the coach");
    setMsgs((x) => [...x, { id: j.id, role: "coach", content: j.content, actions: j.actions ?? [], at: j.createdAt }]);
    if (j.actions?.some((a: { applied: boolean }) => a.applied)) router.refresh();
  }
  async function generate() {
    setGen(true);
    const r = await fetch("/api/coach/letters/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }) });
    setGen(false);
    if (!r.ok) return toast.error("Couldn't write the letter");
    router.refresh(); toast.success("This week's letter is ready");
  }
  const suggestions = ["Should I train today?", "Move my next session to tomorrow", "My knee feels tight after squats", "Ease my next session by 10%", "Set my weigh-in day to Monday"];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl p-6 ring-1 ring-white/[0.06]"><img src="/art/coach.jpg" alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover opacity-85" /><div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-bg)_0%,color-mix(in_oklch,var(--color-bg)_75%,transparent)_60%,transparent_100%)]" />
        <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Sunday letter</p><h1 className="font-display text-4xl font-semibold tracking-tightest">Your week, read back.</h1></div><Button size="sm" variant="secondary" onClick={generate} loading={gen}><Mail /> Write this week's</Button></div></div>
        {letters.length === 0 ? <p className="rounded-2xl bg-surface/50 p-5 text-sm text-fg-muted ring-1 ring-white/[0.04]">Every Sunday evening the coach writes you a short letter: what moved, what stalled, what changes next week and why. Complete a session and write the first one now.</p> : (
          <div className="space-y-2">{letters.map((l) => (
            <article key={l.id} className={cn("rounded-2xl ring-1 ring-white/[0.04] transition-colors", open === l.id ? "bg-surface/70" : "bg-surface/30 hover:bg-surface/50")}>
              <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} className="flex w-full items-center justify-between gap-3 p-5 text-left">
                <div><div className="text-2xs uppercase tracking-[0.14em] text-fg-subtle">Week of {new Date(l.weekStartsOn).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</div><h2 className="font-display text-xl font-semibold tracking-tighter">{l.headline}</h2></div>
                {!l.readAt && <Badge tone="ember">New</Badge>}
              </button>
              <AnimatePresence initial={false}>{open === l.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="prose-coach px-5 pb-5 text-[15px] leading-relaxed text-fg-muted">{l.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
                    {l.adaptations.length ? <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">{l.adaptations.map((a, i) => <li key={i} className="flex gap-2"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-ember" />{a.reason}</li>)}</ul> : null}
                    <p className="mt-3 text-2xs text-fg-subtle">{l.generatedBy === "rules" ? "Written from your numbers by the rules engine." : "Written by the coach from your numbers."}</p>
                  </div>
                </motion.div>)}</AnimatePresence>
            </article>))}</div>
        )}
      </section>
      <section className="flex min-h-[560px] flex-col rounded-3xl bg-surface/40 ring-1 ring-white/[0.04]">
        <div className="border-b border-border p-5"><p className="eyebrow">Talk to the coach</p><h2 className="font-display text-xl font-semibold tracking-tighter">Ask anything about your training, {name}.</h2><p className="mt-1 text-xs text-fg-subtle">Grounded in your profile, plan, logs and readiness. Changes go through the rules engine and are shown here.</p></div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {msgs.length === 0 && <div className="flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} type="button" onClick={() => setText(s)} className="rounded-full border border-border px-3 py-1.5 text-xs text-fg-muted hover:border-border-strong hover:text-fg">{s}</button>)}</div>}
          {msgs.map((m) => (
            <div key={m.id} className={cn("max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "ml-auto bg-ember-soft text-fg" : "bg-surface-2 text-fg")}>
              {m.content}
              {m.actions.length ? <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs">{m.actions.map((a, i) => <li key={i} className={cn("flex items-center gap-1.5", a.applied ? "text-signal" : "text-amber")}>{a.applied ? <Check className="size-3.5" /> : <X className="size-3.5" />}{a.summary}</li>)}</ul> : null}
            </div>))}
          {busy && <CoachPulse label="Coach" items={[{ text: "Reading your last two weeks…", tone: "ember" }]} />}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={ai ? "Message the coach…" : "AI coach is off on this server; ask about readiness or upcoming sessions."} className="min-h-11 flex-1 resize-none py-2.5" rows={1} />
          <Button type="submit" size="icon" aria-label="Send" loading={busy} disabled={!text.trim()}><Send /></Button>
        </form>
      </section>
    </div>
  );
}

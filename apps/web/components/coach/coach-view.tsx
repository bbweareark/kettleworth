"use client";
import { dayMonth } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mail, Send, Sparkles, Check, X } from "lucide-react";
import { Button, Textarea, Badge, CoachPulse, cn, toast } from "@kettleworth/ui";

type Letter = { id: string; weekStartsOn: string; headline: string; body: string; adaptations: { kind: string; reason: string }[]; readAt: string | null; generatedBy: string };
type Msg = { id: string; role: "user" | "coach"; content: string; actions: { type: string; summary: string; applied: boolean }[]; at: string };

/**
 * The coach: letters on the left, conversation on the right.
 *
 * The previous build stacked four photographic panels on this screen - one for the head, one
 * for the empty state, one behind every open letter and one behind the chat - each with its
 * own gradient. Four images with text over them is not atmosphere, it is noise, and it is
 * what the DNA reference refuses to do. The screen head carries the one photograph; the
 * letters and the conversation are set on the raised surface where words belong.
 */
export function CoachView({ letters, history, ai, name }: { letters: Letter[]; history: Msg[]; ai: boolean; name: string }) {
  const reduce = useReducedMotion();
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
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-rule pt-4">
          <h2 className="font-display text-xl">Sunday letters</h2>
          <Button size="sm" variant="secondary" onClick={generate} loading={gen}><Mail /> Write this week&apos;s</Button>
        </div>

        {letters.length === 0 ? (
          <p className="measure mt-4 text-sm text-fg-muted">Every Sunday evening the coach writes you a short letter: what moved, what stalled, what changes next week and why. Complete a session and write the first one now.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {letters.map((l) => (
              <article key={l.id} className={cn("overflow-hidden rounded-lg border transition-colors", open === l.id ? "border-rule-strong bg-surface" : "border-rule bg-surface/60 hover:border-rule-strong")}>
                <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} aria-expanded={open === l.id} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <div className="min-w-0">
                    <p className="meta">Week of {dayMonth(l.weekStartsOn, true)}</p>
                    <h3 className="mt-0.5 font-display text-xl">{l.headline}</h3>
                  </div>
                  {!l.readAt ? <Badge tone="volt">New</Badge> : null}
                </button>
                <AnimatePresence initial={false}>
                  {open === l.id ? (
                    <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="prose-coach border-t border-rule px-4 py-4 text-[15px] leading-relaxed text-fg-muted">
                        {l.body.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
                        {l.adaptations.length ? (
                          <ul className="mt-4 space-y-2 border-t border-rule pt-4 text-sm">
                            {l.adaptations.map((a, i) => <li key={i} className="flex gap-2.5"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-volt" aria-hidden />{a.reason}</li>)}
                          </ul>
                        ) : null}
                        <p className="meta mt-4">{l.generatedBy === "rules" ? "Written from your numbers by the rules engine." : "Written by the coach from your numbers."}</p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-rule bg-surface">
        <div className="border-b border-rule p-4">
          <p className="meta">Talk to your coach</p>
          <h2 className="mt-0.5 font-display text-xl">Ask anything about your training, {name}.</h2>
          <p className="measure mt-1 text-xs text-fg-subtle">Grounded in your profile, plan, logs and readiness. Changes go through the rules engine and are shown here.</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => setText(s)} className="rounded-full border border-rule px-4 py-2 text-xs text-fg-muted transition-colors hover:border-rule-strong hover:text-fg">{s}</button>
              ))}
            </div>
          ) : null}
          {msgs.map((m) => (
            <div key={m.id} className={cn("max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "ml-auto border border-rule-strong text-fg" : "bg-bg text-fg")}>
              {m.content}
              {m.actions.length ? (
                <ul className="mt-2 space-y-1 border-t border-rule pt-2 text-xs">
                  {m.actions.map((a, i) => <li key={i} className={cn("flex items-center gap-1.5", a.applied ? "text-fg" : "text-fg-subtle")}>{a.applied ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}{a.summary}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
          {busy ? <CoachPulse avatar="/art/seal.png" label="Coach" items={[{ text: "Reading your last two weeks…", tone: "ember" }]} /> : null}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="flex items-end gap-2 border-t border-rule p-3">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={ai ? "Message your coach…" : "Ask about readiness, upcoming sessions or recent performance."} className="min-h-12 flex-1 resize-none py-3" rows={1} />
          <Button type="submit" size="icon" aria-label="Send" loading={busy} disabled={!text.trim()}><Send /></Button>
        </form>
      </section>
    </div>
  );
}

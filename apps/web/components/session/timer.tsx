"use client";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, SkipForward } from "lucide-react";
import { Button } from "@kettleworth/ui";

export function RestTimer({ seconds, onDone, onSkip, children, why }: { seconds: number; onDone: () => void; onSkip: () => void; children?: React.ReactNode; why?: string }) {
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const endAt = useRef(Date.now() + seconds * 1000);
  const done = useRef(false);
  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0 && !done.current) { done.current = true; try { navigator.vibrate?.([120, 60, 120]); } catch {} beep(); onDone(); }
    }, 250);
    return () => clearInterval(t);
  }, [onDone]);
  const adjust = (d: number) => { endAt.current += d * 1000; setTotal((t) => Math.max(5, t + d)); };
  const pct = total ? (left / total) * 100 : 0;
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, "0");
  return (
    <div className="rounded-2xl border border-ember/40 bg-ember-soft p-5" role="timer" aria-live="polite" aria-label={`Rest ${mm}:${ss} remaining`}>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-ember">Rest</span><span className="truncate text-right text-fg-muted">{why ?? "Next set when it hits zero"}</span></div>
      <div className="font-mono text-6xl font-semibold tabular tracking-tight">{mm}:{ss}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-ember transition-[width] duration-200" style={{ width: `${pct}%` }} /></div>
      <div className="mt-4 flex gap-2"><Button variant="secondary" size="sm" onClick={() => adjust(-15)} aria-label="Minus 15 seconds"><Minus /> 15s</Button><Button variant="secondary" size="sm" onClick={() => adjust(15)} aria-label="Plus 15 seconds"><Plus /> 15s</Button><Button variant="ghost" size="sm" className="ml-auto" onClick={onSkip}>Skip <SkipForward /></Button></div>
      {children}
    </div>
  );
}
function beep() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.05; o.start(); o.stop(ctx.currentTime + 0.18); } catch {}
}
export function ElapsedClock({ since }: { since: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!since) return null;
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  return <span className="font-mono tabular text-fg-subtle">{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</span>;
}

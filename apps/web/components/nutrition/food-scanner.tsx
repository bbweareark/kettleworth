"use client";
import { useEffect, useRef, useState } from "react";
import { ScanBarcode, Camera, X, Keyboard, Loader2, ImagePlus } from "lucide-react";
import { Button, Input, cn, toast } from "@kettleworth/ui";

export type Product = { barcode: string; name: string; brand: string | null; per100: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number; sugarG: number | null; saltG: number | null }; unit: "g" | "ml"; servingSize: number | null; servingLabel: string | null; imageUrl: string | null };
type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/**
 * Live barcode reading. Uses the browser's own detector where it exists (Chrome, Android) and a bundled ZXing reader
 * everywhere else (Safari on iPhone), so the same button works on every phone. Typing the number is always an option.
 */
export function BarcodeScanner({ onProduct, onClose }: { onProduct: (p: Product) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stop = useRef<() => void>(() => {});
  const handled = useRef(false);
  const [state, setState] = useState<"starting" | "scanning" | "looking" | "denied" | "manual">("starting");
  const [code, setCode] = useState("");

  async function lookup(raw: string) {
    if (handled.current) return;
    handled.current = true; stop.current(); setState("looking");
    try { navigator.vibrate?.(40); } catch {}
    const r = await fetch(`/api/nutrition/barcode?code=${encodeURIComponent(raw)}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error(j.error ?? "Lookup failed"); handled.current = false; setState("manual"); setCode(raw); return; }
    if (!j.product) { toast.message("Not in the product database yet", { description: `Barcode ${raw}. Describe it or photograph it instead.` }); handled.current = false; setState("manual"); setCode(raw); return; }
    onProduct(j.product as Product);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const el = video.current; if (!el) return;
      try {
        const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector & { constructor: { getSupportedFormats?: () => Promise<string[]> } } }).BarcodeDetector;
        const nativeOk = Native ? (await ((Native as unknown as { getSupportedFormats?: () => Promise<string[]> }).getSupportedFormats?.() ?? Promise.resolve(FORMATS))).some((f) => FORMATS.includes(f)) : false;
        if (nativeOk && Native) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          el.srcObject = stream; await el.play(); setState("scanning");
          const det = new Native({ formats: FORMATS });
          let raf = 0; let alive = true;
          const tick = async () => { if (!alive) return; try { const found = await det.detect(el); if (found[0]?.rawValue) return lookup(found[0].rawValue); } catch {} raf = window.setTimeout(tick, 180) as unknown as number; };
          tick();
          stop.current = () => { alive = false; clearTimeout(raf); stream.getTracks().forEach((t) => t.stop()); };
        } else {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, el, (result) => { if (result) lookup(result.getText()); });
          if (cancelled) { controls.stop(); return; }
          setState("scanning");
          stop.current = () => controls.stop();
        }
      } catch (e) {
        if (!cancelled) setState((e as { name?: string })?.name === "NotAllowedError" ? "denied" : "manual");
      }
    })();
    return () => { cancelled = true; stop.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
        <video ref={video} playsInline muted className={cn("size-full object-cover", state !== "scanning" && "opacity-30")} />
        {state === "scanning" ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-28 w-3/4 rounded-xl ring-2 ring-white/70">
              <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded-full bg-ember shadow-[0_0_16px_var(--color-ember)]" />
            </div>
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-3 text-center text-sm text-white/80">
          {state === "starting" ? "Opening the camera" : state === "scanning" ? "Hold the barcode inside the frame" : state === "looking" ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Looking it up</span> : state === "denied" ? "Camera access was declined. Type the number instead." : "Type the number under the barcode."}
        </div>
        <button type="button" onClick={() => { stop.current(); onClose(); }} aria-label="Close scanner" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"><X className="size-4" /></button>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.replace(/\D/g, "").length >= 8) { handled.current = false; lookup(code); } }}>
        <div className="relative flex-1"><Keyboard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Or type the barcode number" className="pl-9" aria-label="Barcode number" /></div>
        <Button type="submit" variant="secondary" disabled={code.replace(/\D/g, "").length < 8}>Look up</Button>
      </form>
    </div>
  );
}

/** Portion picker for a scanned product: servings or grams, with the label's numbers scaled live. */
export function ProductCard({ product, busy, onLog, onCancel }: { product: Product; busy: boolean; onLog: (amount: number, macros: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number }, label: string) => void; onCancel: () => void }) {
  const serving = product.servingSize && product.servingSize > 0 ? product.servingSize : null;
  const [mode, setMode] = useState<"serving" | "amount">(serving ? "serving" : "amount");
  const [servings, setServings] = useState(1);
  const [amount, setAmount] = useState(serving ?? (product.unit === "ml" ? 250 : 100));
  const qty = mode === "serving" && serving ? serving * servings : amount;
  const k = qty / 100;
  const m = { calories: Math.round(product.per100.calories * k), proteinG: Math.round(product.per100.proteinG * k * 10) / 10, carbsG: Math.round(product.per100.carbsG * k * 10) / 10, fatG: Math.round(product.per100.fatG * k * 10) / 10, fibreG: Math.round(product.per100.fibreG * k * 10) / 10 };
  const brandShort = product.brand?.replace(/\b(services|limited|ltd|plc|inc|sa\/nv|sa|nv|gmbh|llc|uk|group|company|co)\b\.?/gi, "").replace(/\s+/g, " ").trim() ?? "";
  const label = brandShort && !product.name.toLowerCase().includes(brandShort.toLowerCase()) ? `${brandShort} ${product.name}` : product.name;
  return (
    <div className="space-y-4 rounded-2xl bg-black/25 p-4 ring-1 ring-white/[0.07]">
      <div className="flex items-start gap-3">
        {product.imageUrl ? <img src={product.imageUrl} alt="" className="size-16 shrink-0 rounded-xl bg-white object-contain p-1" /> : <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-white/[0.05]"><ScanBarcode className="size-6 text-fg-subtle" /></div>}
        <div className="min-w-0 flex-1">
          <div className="text-2xs uppercase tracking-[0.16em] text-signal">From the label</div>
          <div className="truncate font-display text-lg font-semibold tracking-tight">{product.name}</div>
          <div className="text-xs text-fg-subtle">{product.brand ?? "Unknown brand"} · {product.per100.calories} kcal per 100 {product.unit}{product.servingLabel ? ` · serving ${product.servingLabel}` : ""}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {serving ? <div className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.07]">{(["serving", "amount"] as const).map((x) => <button key={x} type="button" onClick={() => setMode(x)} className={cn("h-8 rounded-full px-3 text-sm", mode === x ? "bg-fg text-bg" : "text-fg-muted")}>{x === "serving" ? "Servings" : product.unit === "ml" ? "Millilitres" : "Grams"}</button>)}</div> : null}
        {mode === "serving" && serving ? (
          <div className="flex gap-1">{[0.5, 1, 1.5, 2, 3].map((s) => <button key={s} type="button" onClick={() => setServings(s)} className={cn("h-9 min-w-10 rounded-full px-3 text-sm tabular ring-1", servings === s ? "bg-ember text-ember-fg ring-ember" : "text-fg-muted ring-white/10")}>{s}</button>)}</div>
        ) : (
          <label className="flex items-center gap-2 text-sm"><Input inputMode="decimal" value={String(amount)} onChange={(e) => setAmount(Math.max(0, Number(e.target.value.replace(/[^0-9.]/g, "")) || 0))} className="h-9 w-24" aria-label={`Amount in ${product.unit}`} />{product.unit}</label>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">{[["kcal", m.calories], ["protein", m.proteinG], ["carbs", m.carbsG], ["fat", m.fatG]].map(([l, v]) => <div key={l as string} className="rounded-xl bg-white/[0.04] py-2"><div className="font-display text-lg font-semibold tabular">{v}</div><div className="text-[10px] uppercase tracking-wider text-fg-subtle">{l}</div></div>)}</div>
      {product.per100.sugarG != null && product.per100.sugarG * k >= 1 ? <p className="text-xs text-fg-subtle">Includes {Math.round(product.per100.sugarG * k)} g sugar.</p> : null}
      <div className="flex justify-between gap-2"><Button variant="ghost" onClick={onCancel}>Scan another</Button><Button loading={busy} disabled={qty <= 0} onClick={() => onLog(qty, m, `${label}, ${Math.round(qty)} ${product.unit}`)}>Log {m.calories} kcal</Button></div>
    </div>
  );
}

/** Downscale a photo in the browser before it is sent: faster on a gym's signal, and nothing larger than needed leaves the phone. */
export async function preparePhoto(file: File): Promise<{ data: string; mediaType: "image/jpeg" }> {
  const bitmap = await createImageBitmap(file).catch(async () => { const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode(); return img; });
  const w = "width" in bitmap ? bitmap.width : 0, h = "height" in bitmap ? bitmap.height : 0;
  const scale = Math.min(1, 1280 / Math.max(w, h));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.82);
  return { data: url.slice(url.indexOf(",") + 1), mediaType: "image/jpeg" };
}

export function PhotoButton({ busy, onPhoto }: { busy: boolean; onPhoto: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={input} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Photograph your food" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="group relative flex min-h-36 flex-col items-start justify-end overflow-hidden rounded-2xl bg-[linear-gradient(140deg,color-mix(in_oklch,var(--color-ember)_22%,transparent),transparent_70%)] p-4 text-left ring-1 ring-ember/25 transition-transform active:scale-[0.99] disabled:opacity-60">
        <div className="mb-auto grid size-11 place-items-center rounded-xl bg-ember-soft">{busy ? <Loader2 className="size-5 animate-spin text-ember" /> : <Camera className="size-5 text-ember" />}</div>
        <div className="mt-4 font-display text-lg font-semibold tracking-tight">{busy ? "Reading your plate" : "Photograph your plate"}</div>
        <div className="text-xs text-fg-muted">{busy ? "Identifying each item and its portion" : "Every item and portion, itemised"}</div>
        <ImagePlus aria-hidden className="absolute -right-3 -top-3 size-24 text-white/[0.03]" />
      </button>
    </>
  );
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, exerciseVideo } from "@kettleworth/db";

/** Mux webhook: flips exercise_video rows to ready (or errored) as assets finish processing. Verifies the Mux signature. */
export async function POST(req: Request) {
  const body = await req.text();
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("mux-signature") ?? "";
    const t = /t=(\d+)/.exec(sig)?.[1], v1 = /v1=([a-f0-9]+)/.exec(sig)?.[1];
    if (!t || !v1) return NextResponse.json({ error: "bad signature" }, { status: 400 });
    const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
    if (expected.length !== v1.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const evt = JSON.parse(body) as { type: string; data: { id: string; status?: string; playback_ids?: { id: string }[]; duration?: number } };
  if (evt.type === "video.asset.ready" || evt.type === "video.asset.errored") {
    const playbackId = evt.data.playback_ids?.[0]?.id ?? null;
    await db().update(exerciseVideo).set({ status: evt.type === "video.asset.ready" ? "ready" : "errored", playbackId, durationSeconds: evt.data.duration ? Math.round(evt.data.duration) : null, thumbnailUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1` : null, previewGifUrl: playbackId ? `https://image.mux.com/${playbackId}/animated.gif?width=320` : null, isPlaceholder: false }).where(eq(exerciseVideo.assetId, evt.data.id));
  }
  return NextResponse.json({ received: true });
}

/**
 * Upload real exercise footage to Mux and flip the library from placeholder stills to video.
 *
 *   pnpm --filter @kettleworth/db exec tsx scripts/upload-videos.ts videos.json
 *
 * videos.json: [{ "exerciseId": "barbell-back-squat", "url": "https://.../squat-front.mp4", "angle": "front", "license": "Kettleworth original" }, ...]
 * `url` must be publicly fetchable by Mux (S3/R2 signed URL is fine). Requires MUX_TOKEN_ID / MUX_TOKEN_SECRET.
 * Assets are created with a public playback policy and mp4 support off; the Mux webhook (/api/webhooks/mux) marks them ready.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb, exercise, exerciseVideo } from "../src";

type Row = { exerciseId: string; url: string; angle?: string; license?: string };
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: tsx scripts/upload-videos.ts videos.json");
  const id = process.env.MUX_TOKEN_ID, secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET are required");
  const rows = JSON.parse(readFileSync(file, "utf8")) as Row[];
  const db = createDb();
  const auth = "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
  let ok = 0;
  for (const r of rows) {
    const [ex] = await db.select({ id: exercise.id }).from(exercise).where(eq(exercise.id, r.exerciseId)).limit(1);
    if (!ex) { console.warn(`skip: unknown exercise ${r.exerciseId}`); continue; }
    const res = await fetch("https://api.mux.com/video/v1/assets", { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ input: [{ url: r.url }], playback_policy: ["public"], video_quality: "basic", passthrough: `${r.exerciseId}|${r.angle ?? "front"}` }) });
    if (!res.ok) { console.error(`mux error for ${r.exerciseId}: ${res.status} ${await res.text()}`); continue; }
    const { data } = (await res.json()) as { data: { id: string; playback_ids?: { id: string }[]; status: string } };
    const playbackId = data.playback_ids?.[0]?.id ?? null;
    const vid = `${r.exerciseId}-${r.angle ?? "front"}`;
    await db.insert(exerciseVideo).values({ id: vid, exerciseId: r.exerciseId, provider: "mux", assetId: data.id, playbackId, status: data.status === "ready" ? "ready" : "processing", angle: r.angle ?? "front", thumbnailUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1` : null, previewGifUrl: playbackId ? `https://image.mux.com/${playbackId}/animated.gif?width=320` : null, license: r.license ?? "Kettleworth original", isPlaceholder: false })
      .onConflictDoUpdate({ target: exerciseVideo.id, set: { assetId: data.id, playbackId, status: data.status === "ready" ? "ready" : "processing", isPlaceholder: false, license: r.license ?? "Kettleworth original" } });
    ok++;
    console.log(`queued ${r.exerciseId} (${r.angle ?? "front"}) → asset ${data.id}`);
  }
  console.log(`Done: ${ok}/${rows.length} uploaded. Assets become playable when the Mux webhook reports video.asset.ready.`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

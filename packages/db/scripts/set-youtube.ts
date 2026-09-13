/**
 * Attach YouTube demonstrations from a curated list, verifying each id through YouTube's public oEmbed endpoint
 * (title + channel come from YouTube itself, so credit is always accurate).
 *   pnpm --filter @kettleworth/db exec tsx scripts/set-youtube.ts videos.json
 * videos.json: [{ "exerciseId": "barbell-back-squat", "videoId": "..." }, ...]
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb, exercise, exerciseVideo } from "../src";

async function main() {
  const rows = JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { exerciseId: string; videoId: string }[];
  const db = createDb();
  let ok = 0;
  for (const r of rows) {
    const [ex] = await db.select({ id: exercise.id }).from(exercise).where(eq(exercise.id, r.exerciseId)).limit(1);
    if (!ex) { console.warn(`skip unknown exercise ${r.exerciseId}`); continue; }
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${r.videoId}&format=json`);
    if (!res.ok) { console.warn(`skip ${r.exerciseId}: video ${r.videoId} not embeddable (${res.status})`); continue; }
    const meta = (await res.json()) as { title: string; author_name: string; thumbnail_url: string };
    // Two relevance gates: a reputable coaching channel, and a title that names the movement.
    const ALLOW = ["jeff nippard", "alan thrall", "squat university", "calisthenicmovement", "scotthermanfitness", "athlean-x", "renaissance periodization", "jeremy ethier", "juggernaut", "barbell medicine", "fitnessfaqs", "stronger by science", "buff dudes", "mind pump", "catalyst athletics", "starting strength", "musclewiki", "meg squats"];
    const KEYWORDS: Record<string, string[]> = { squat: ["squat"], deadlift: ["deadlift"], bench: ["bench"], overhead: ["overhead", "shoulder press", "press"], military: ["overhead", "press"], "pull-up": ["pull up", "pull-up", "pullup"], "push-up": ["push up", "push-up", "pushup"], thrust: ["hip thrust"], row: ["row"], dip: ["dip"], swing: ["swing"], goblet: ["goblet"] };
    const author = meta.author_name.toLowerCase(); const title = meta.title.toLowerCase();
    if (!ALLOW.some((a) => author.includes(a))) { console.warn(`skip ${r.exerciseId}: channel "${meta.author_name}" not on the coaching allowlist`); continue; }
    const kw = Object.entries(KEYWORDS).find(([k]) => r.exerciseId.includes(k))?.[1] ?? [r.exerciseId.split("-").pop()!];
    if (!kw.some((k) => title.includes(k))) { console.warn(`skip ${r.exerciseId}: title "${meta.title}" does not name the movement`); continue; }
    const id = `${r.exerciseId}-youtube`;
    const values = { exerciseId: r.exerciseId, provider: "youtube" as const, playbackId: r.videoId, assetId: null, status: "ready" as const, angle: "front", durationSeconds: null, thumbnailUrl: meta.thumbnail_url, previewGifUrl: null, license: `YouTube embed · ${meta.author_name}`, isPlaceholder: false };
    await db.insert(exerciseVideo).values({ id, ...values }).onConflictDoUpdate({ target: exerciseVideo.id, set: values });
    ok++; console.log(`✓ ${r.exerciseId} ← ${meta.author_name}: ${meta.title}`);
  }
  console.log(`Done: ${ok}/${rows.length}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

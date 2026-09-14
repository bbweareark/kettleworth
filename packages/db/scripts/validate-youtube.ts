/** Re-check every attached YouTube video against the relevance gate using oEmbed (free, no quota). Deletes failures. */
import { config } from "dotenv";
config({ path: "../../.env" });
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb, exercise, exerciseVideo } from "../src";
import { relevant, allowed } from "./youtube-gate";
const trusted = new Set((JSON.parse(readFileSync("seed/data/youtube-verified.json", "utf8")) as { exerciseId: string }[]).map((r) => r.exerciseId));
async function main() {
  const db = createDb();
  const rows = await db.select({ v: exerciseVideo, name: exercise.name }).from(exerciseVideo).innerJoin(exercise, eq(exercise.id, exerciseVideo.exerciseId)).where(eq(exerciseVideo.provider, "youtube"));
  let kept = 0, removed = 0;
  for (const { v, name } of rows) {
    if (trusted.has(v.exerciseId)) { kept++; continue; }
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.playbackId}&format=json`);
    if (!res.ok) { await db.delete(exerciseVideo).where(eq(exerciseVideo.id, v.id)); removed++; console.log(`✗ ${name}: not embeddable`); continue; }
    const meta = (await res.json()) as { title: string; author_name: string };
    const r = relevant(name, meta.title);
    if (!allowed(meta.author_name) || !r.ok) { await db.delete(exerciseVideo).where(eq(exerciseVideo.id, v.id)); removed++; console.log(`✗ ${name} ← "${meta.title}" (${allowed(meta.author_name) ? r.reason : "channel"})`); }
    else { kept++; console.log(`✓ ${name} ← "${meta.title}" (${r.reason})`); }
  }
  console.log(`Kept ${kept}, removed ${removed}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

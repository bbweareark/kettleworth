/**
 * Fill the exercise library with YouTube demonstration videos via the official YouTube Data API v3.
 *
 *   YOUTUBE_API_KEY=... pnpm --filter @kettleworth/db exec tsx scripts/find-youtube.ts [--limit 100] [--only-curated]
 *
 * For each exercise without a non-placeholder video it searches "<name> exercise form", restricted to an allowlist of
 * reputable coaching channels, and stores the top short (< 4 min), embeddable result as provider "youtube".
 * Videos are embedded (never downloaded) with youtube-nocookie.com, which is what YouTube's terms permit.
 * Rows are marked license "YouTube embed (channel credited)" and isPlaceholder=false. Re-runs skip filled rows.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import { and, desc, eq } from "drizzle-orm";
import { createDb, exercise, exerciseVideo } from "../src";
import { relevant, allowed } from "./youtube-gate";

const KEY = process.env.YOUTUBE_API_KEY;
const ALLOWLIST = (process.env.YOUTUBE_CHANNEL_ALLOWLIST ?? "").split(",").map((s) => s.trim()).filter(Boolean);
// Reputable coaching channels by name (matched case-insensitively against channelTitle). Extend via YOUTUBE_CHANNEL_ALLOWLIST.
const DEFAULT_CHANNELS = ["Jeff Nippard", "Renaissance Periodization", "Squat University", "Alan Thrall", "Juggernaut Training Systems", "Barbell Medicine", "Calisthenicmovement", "ScottHermanFitness", "Athlean-X", "Buff Dudes", "Mind Pump TV", "FitnessFAQs", "Stronger By Science", "Jeremy Ethier", "Omar Isuf", "Meg Squats", "Girls Gone Strong", "Catalyst Athletics", "Mark Rippetoe", "Starting Strength", "Bodybuilding.com", "MuscleWiki", "Testosterone Nation", "T NATION"];
const channels = [...DEFAULT_CHANNELS, ...ALLOWLIST].map((c) => c.toLowerCase());

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1] || 0) || 200;
const onlyCurated = args.includes("--only-curated");

type Search = { items: { id: { videoId: string }; snippet: { title: string; channelTitle: string; channelId: string } }[] };
type Videos = { items: { id: string; contentDetails: { duration: string }; status: { embeddable: boolean; privacyStatus: string } }[] };
const isoToSec = (d: string) => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d); return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0; };

async function main() {
  if (!KEY) throw new Error("YOUTUBE_API_KEY is required (Google Cloud Console → YouTube Data API v3)");
  const db = createDb();
  const rows = await db.select().from(exercise).orderBy(desc(exercise.popularity));
  let done = 0, filled = 0, skipped = 0;
  for (const ex of rows) {
    if (done >= limit) break;
    if (onlyCurated && ex.popularity < 75) continue;
    const [existing] = await db.select({ id: exerciseVideo.id }).from(exerciseVideo).where(and(eq(exerciseVideo.exerciseId, ex.id), eq(exerciseVideo.isPlaceholder, false))).limit(1);
    if (existing) { skipped++; continue; }
    done++;
    const q = `"${ex.name}" how to form`;
    const s = (await (await fetch(`https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({ key: KEY, part: "snippet", type: "video", videoEmbeddable: "true", videoDuration: "short", safeSearch: "strict", maxResults: "10", q })}`)).json()) as Search & { error?: { message: string } };
    if ((s as { error?: { message: string } }).error) throw new Error((s as { error: { message: string } }).error.message);
    const candidates = (s.items ?? []).filter((i) => (allowed(i.snippet.channelTitle) || channels.some((c) => i.snippet.channelTitle.toLowerCase().includes(c))) && relevant(ex.name, i.snippet.title).ok);
    const pick = candidates[0] ?? null;
    if (!pick) { console.log(`no allowlisted, on-topic result: ${ex.name}`); continue; }
    const v = (await (await fetch(`https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({ key: KEY, part: "contentDetails,status", id: pick.id.videoId })}`)).json()) as Videos;
    const meta = v.items?.[0];
    if (!meta || !meta.status.embeddable || meta.status.privacyStatus !== "public") { console.log(`not embeddable: ${ex.name}`); continue; }
    const id = `${ex.id}-youtube`;
    await db.insert(exerciseVideo).values({ id, exerciseId: ex.id, provider: "youtube", playbackId: pick.id.videoId, assetId: pick.snippet.channelId, status: "ready", angle: "front", durationSeconds: isoToSec(meta.contentDetails.duration), thumbnailUrl: `https://i.ytimg.com/vi/${pick.id.videoId}/hqdefault.jpg`, previewGifUrl: null, license: `YouTube embed · ${pick.snippet.channelTitle}`, isPlaceholder: false })
      .onConflictDoUpdate({ target: exerciseVideo.id, set: { playbackId: pick.id.videoId, assetId: pick.snippet.channelId, status: "ready", durationSeconds: isoToSec(meta.contentDetails.duration), thumbnailUrl: `https://i.ytimg.com/vi/${pick.id.videoId}/hqdefault.jpg`, license: `YouTube embed · ${pick.snippet.channelTitle}`, isPlaceholder: false } });
    filled++;
    console.log(`✓ ${ex.name} ← ${pick.snippet.channelTitle}: ${pick.snippet.title}`);
  }
  console.log(`Done. filled ${filled}, already had video ${skipped}, searched ${done}. Quota used ≈ ${done * 101} units (10k/day free).`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

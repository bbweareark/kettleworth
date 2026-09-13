import { config } from "dotenv";
config({ path: "../../.env" });
import { createDb, exercise, exerciseVideo, recipe } from "../src";
import { sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CURATED, findCurated } from "./data/curated";
import { RECIPES } from "./data/recipes";
import { contraindications, mapCategory, mapDifficulty, mapEquipment, mapMuscles, mapPattern, slugify, unilateral, type FedbExercise } from "./map-exercise";

const here = path.dirname(fileURLToPath(import.meta.url));
/** Editorial weight for uncurated rows: plain, common movements rank above odd variants. */
function popularityFor(x: FedbExercise, name: string, mechanics: string): number {
  const n = name.toLowerCase();
  let p = mechanics === "compound" ? 35 : 25;
  if (x.category === "olympic weightlifting" || x.category === "strongman" || x.category === "plyometrics") p = 8;
  if (/\b(smith|sled|band|speed|heaving|balance|snatch|clean|jerk|one-arm|single-arm|alternat|wide-grip|narrow|reverse-grip|decline|behind|suspended|bosu|ball|zercher|jefferson|sissy|kneeling|elevated|pass-through|overhead walk|backward)\b/.test(n)) p -= 12;
  if (/^(barbell|dumbbell|cable|machine|seated|standing|lying|incline|leg|lat|bent over|kettlebell)\b/.test(n)) p += 10;
  if (/\b(squat|deadlift|bench press|row|press|pull-?up|chin-?up|pulldown|curl|extension|raise|lunge|dip|plank|crunch|thrust|bridge|swing)\b/.test(n)) p += 8;
  if (x.level === "beginner") p += 4;
  return Math.max(3, Math.min(70, p));
}
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

async function main() {
  const db = createDb();
  const raw = JSON.parse(readFileSync(path.join(here, "data/free-exercise-db.json"), "utf8")) as FedbExercise[];
  const seen = new Set<string>();
  const rows = [];
  for (const x of raw) {
    if (x.category === "strongman") continue; // atlas stones etc: not programmable in normal gyms
    const cur = findCurated(x.name);
    const name = cur?.canonicalName ?? x.name.replace(/\s+-\s+.*$/, "").trim();
    let slug = slugify(name);
    if (seen.has(slug)) slug = slugify(x.name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    const primary = mapMuscles(x.primaryMuscles);
    const secondary = mapMuscles(x.secondaryMuscles).filter((m) => !primary.includes(m));
    const equipment = mapEquipment(x.equipment, x.name);
    const pattern = mapPattern(x, primary);
    const category = mapCategory(x);
    const mechanics = x.mechanic ?? (pattern === "isolation" ? "isolation" : "compound");
    rows.push({
      id: slug, slug, name,
      aliases: [...new Set([x.name !== name ? x.name : null, ...(cur?.aliases ?? [])].filter(Boolean) as string[])],
      primaryMuscles: primary, secondaryMuscles: secondary, equipment, pattern, mechanics: mechanics as "compound" | "isolation",
      difficulty: mapDifficulty(x.level, x.category), category,
      contraindicatedRegions: contraindications(x, pattern, primary, equipment), unilateral: unilateral(x.name),
      instructions: x.instructions, cues: cur?.cues ?? [], commonMistakes: cur?.mistakes ?? [], safetyNotes: cur?.safety ?? [], variations: cur?.variations ?? [],
      imageUrls: x.images.map((p) => IMAGE_BASE + p),
      source: "free-exercise-db", sourceLicense: "Unlicense (public domain)",
      searchText: [name, x.name, ...(cur?.aliases ?? []), ...primary, ...equipment, pattern].join(" ").toLowerCase(),
      popularity: cur?.popularity ?? popularityFor(x, name, mechanics),
    });
  }
  console.log(`Importing ${rows.length} exercises (${CURATED.length} curated) ...`);
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await db.insert(exercise).values(chunk).onConflictDoUpdate({
      target: exercise.id,
      set: { name: sql`excluded.name`, aliases: sql`excluded.aliases`, primaryMuscles: sql`excluded.primary_muscles`, secondaryMuscles: sql`excluded.secondary_muscles`, equipment: sql`excluded.equipment`, pattern: sql`excluded.pattern`, mechanics: sql`excluded.mechanics`, difficulty: sql`excluded.difficulty`, category: sql`excluded.category`, contraindicatedRegions: sql`excluded.contraindicated_regions`, unilateral: sql`excluded.unilateral`, instructions: sql`excluded.instructions`, cues: sql`excluded.cues`, commonMistakes: sql`excluded.common_mistakes`, safetyNotes: sql`excluded.safety_notes`, variations: sql`excluded.variations`, imageUrls: sql`excluded.image_urls`, searchText: sql`excluded.search_text`, popularity: sql`excluded.popularity`, updatedAt: new Date() },
    });
  }
  // Placeholder video rows: one per exercise, clearly labelled, pointing at the still images until real footage is uploaded.
  const videoRows = rows.map((r) => ({ id: `${r.id}-placeholder`, exerciseId: r.id, provider: "placeholder" as const, playbackId: null, assetId: null, status: "placeholder" as const, angle: "front", durationSeconds: null, thumbnailUrl: r.imageUrls[0] ?? null, previewGifUrl: null, license: "Unlicense (stills)", isPlaceholder: true }));
  for (let i = 0; i < videoRows.length; i += 200) await db.insert(exerciseVideo).values(videoRows.slice(i, i + 200)).onConflictDoNothing();

  console.log(`Importing ${RECIPES.length} recipes ...`);
  await db.insert(recipe).values(RECIPES.map((r) => ({ ...r, servings: 1 }))).onConflictDoUpdate({ target: recipe.id, set: { name: sql`excluded.name`, description: sql`excluded.description`, slots: sql`excluded.slots`, dietTypes: sql`excluded.diet_types`, allergens: sql`excluded.allergens`, prepMinutes: sql`excluded.prep_minutes`, costTier: sql`excluded.cost_tier`, macros: sql`excluded.macros`, ingredients: sql`excluded.ingredients`, steps: sql`excluded.steps`, tags: sql`excluded.tags` } });
  const counted = await db.execute<{ count: string }>(sql`select count(*)::text as count from exercise`);
  const count = counted[0]?.count;
  console.log(`Done. exercise rows: ${count}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

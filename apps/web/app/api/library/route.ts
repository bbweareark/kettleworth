import { NextResponse } from "next/server";
import { searchExercises } from "@kettleworth/api";
/** Public search endpoint (library is public). */
export async function GET(req: Request) {
  const s = new URL(req.url).searchParams;
  const out = await searchExercises({ q: s.get("q") ?? undefined, muscle: s.get("muscle") ?? undefined, equipment: s.get("equipment") ?? undefined, pattern: s.get("pattern") ?? undefined, difficulty: s.get("difficulty") ?? undefined, category: s.get("category") ?? undefined, limit: Number(s.get("limit") ?? 40), offset: Number(s.get("offset") ?? 0) });
  return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}

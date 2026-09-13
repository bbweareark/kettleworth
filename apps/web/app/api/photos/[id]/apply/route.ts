import { z } from "zod";
import { applyAnalysis } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ priorityMuscles: z.boolean(), bodyFat: z.boolean() }), async ({ userId, params, body }) => { const r = await applyAnalysis(userId, params.id!, body); return { priorityMuscles: r.profile.priorityMuscles, bodyFatPct: r.profile.bodyFatPct ?? null }; });

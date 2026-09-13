import { z } from "zod";
import { logManualActivity, activitiesForDay, getProfile } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId }) => activitiesForDay(userId));
export const POST = route(z.object({ type: z.string().min(1).max(40), durationMin: z.number().int().min(1).max(600), intensity: z.number().int().min(1).max(5), distanceKm: z.number().min(0).max(500).nullable().optional(), at: z.string().optional(), note: z.string().max(200).nullable().optional() }), async ({ userId, body }) => {
  const rec = await getProfile(userId);
  const r = await logManualActivity(userId, body, rec?.profile.weightKg ?? 75);
  return { ok: true, ...r, activities: await activitiesForDay(userId) };
});

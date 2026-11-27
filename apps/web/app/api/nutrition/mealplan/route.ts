import { z } from "zod";
import { getOrBuildMealPlan } from "@kettleworth/api";
import { route } from "@/lib/api";

/*
 * This week's meal plan, built once per week.
 *
 * `force` came straight from the client and bypassed the per-week guard on a paid
 * generation, so the plan could be rebuilt without limit by anyone with an account. Removed
 * for the same reason, and with the same trade, as the weekly letter's: see that route.
 */
export const POST = route(z.object({ weekStartsOn: z.string().date().optional() }), async ({ userId, body }) => {
  const r = await getOrBuildMealPlan(userId, body.weekStartsOn);
  return { weekStartsOn: r.weekStartsOn, plan: r.plan, coachNote: r.coachNote };
});

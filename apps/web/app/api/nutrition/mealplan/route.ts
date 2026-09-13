import { z } from "zod";
import { getOrBuildMealPlan } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ weekStartsOn: z.string().date().optional(), force: z.boolean().optional() }), async ({ userId, body }) => { const r = await getOrBuildMealPlan(userId, body.weekStartsOn, { force: body.force }); return { weekStartsOn: r.weekStartsOn, plan: r.plan, coachNote: r.coachNote }; });

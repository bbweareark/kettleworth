import { ensureNutritionPlan } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId }) => ensureNutritionPlan(userId, { force: true, reason: "manual recalculation" }));

import { completeOnboarding, ensureNutritionPlan } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId }) => {
  const rec = await completeOnboarding(userId);
  await ensureNutritionPlan(userId, { force: true, reason: "onboarding" });
  return { ok: true, aiSummary: rec.aiSummary, baseline: rec.baseline };
});

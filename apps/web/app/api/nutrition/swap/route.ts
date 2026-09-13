import { z } from "zod";
import { MealSlot } from "@kettleworth/types";
import { swapMeal } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ weekStartsOn: z.string().date(), day: z.number().int().min(0).max(6), slot: MealSlot, toRecipeId: z.string() }), async ({ userId, body }) => swapMeal(userId, body.weekStartsOn, body.day, body.slot, body.toRecipeId));

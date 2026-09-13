import { z } from "zod";
import { MealSlot, RecipeMacros } from "@kettleworth/types";
import { logFood, foodLogForDay } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(z.object({ date: z.string().date() }), async ({ userId, body }) => foodLogForDay(userId, body.date));
export const POST = route(z.object({ loggedOn: z.string().date(), slot: MealSlot, label: z.string().min(1).max(120), recipeId: z.string().nullable().optional(), servings: z.number().positive().max(10).optional(), macros: RecipeMacros }), async ({ userId, body }) => logFood(userId, body));

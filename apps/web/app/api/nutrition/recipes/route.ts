import { z } from "zod";
import { MealSlot } from "@kettleworth/types";
import { listRecipesFor } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(z.object({ slot: MealSlot.optional() }), async ({ userId, body }) => (await listRecipesFor(userId, body.slot)).map((r) => ({ id: r.id, name: r.name, prepMinutes: r.prepMinutes, macros: r.macros, tags: r.tags, costTier: r.costTier })));

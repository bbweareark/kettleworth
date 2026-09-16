import { z } from "zod";
import { adjustRemainingLoads } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ afterSetNumber: z.number().int().min(0), weightKg: z.number().min(0).max(500), reason: z.string().max(300) }), async ({ userId, params, body }) => adjustRemainingLoads(userId, params.id!, body.afterSetNumber, body.weightKg, body.reason));

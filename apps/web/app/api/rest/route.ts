import { z } from "zod";
import { recordRestActivity } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ sessionId: z.string().uuid().nullable().optional(), kind: z.enum(["quiz", "fact", "breathe", "predict"]), itemId: z.string().nullable().optional(), correct: z.boolean().nullable().optional(), detail: z.record(z.string(), z.unknown()).nullable().optional() }), async ({ userId, body }) => recordRestActivity(userId, body));

import { z } from "zod";
import { completeSession } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ sessionRpe: z.number().min(5).max(10).nullable().optional(), soreness: z.number().int().min(1).max(5).nullable().optional(), fatigue: z.number().int().min(1).max(5).nullable().optional(), mood: z.number().int().min(1).max(5).nullable().optional(), notes: z.string().max(1000).nullable().optional() }), async ({ userId, params, body }) => completeSession(userId, params.id!, body));

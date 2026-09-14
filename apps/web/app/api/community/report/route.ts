import { z } from "zod";
import { reportContent } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ targetType: z.enum(["post", "comment", "user"]), targetId: z.string(), reason: z.string().min(2).max(500) }), async ({ userId, body }) => { await reportContent(userId, body.targetType, body.targetId, body.reason); });

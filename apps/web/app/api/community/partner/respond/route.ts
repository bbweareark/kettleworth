import { z } from "zod";
import { respondPartner } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ matchId: z.string().uuid(), accept: z.boolean() }), async ({ userId, body }) => { await respondPartner(userId, body.matchId, body.accept); });

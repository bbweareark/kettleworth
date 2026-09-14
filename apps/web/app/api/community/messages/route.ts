import { z } from "zod";
import { sendMessage, thread } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(z.object({ matchId: z.string().uuid() }), async ({ userId, body }) => ({ messages: await thread(userId, body.matchId) }));
export const POST = route(z.object({ matchId: z.string().uuid(), body: z.string().min(1).max(2000) }), async ({ userId, body }) => sendMessage(userId, body.matchId, body.body));

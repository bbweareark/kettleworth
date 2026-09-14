import { z } from "zod";
import { markLetterRead } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ id: z.string().uuid() }), async ({ userId, body }) => { await markLetterRead(userId, body.id); return { ok: true }; });

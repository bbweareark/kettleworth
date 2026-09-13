import { z } from "zod";
import { generateAndSaveProgramme } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ continueFrom: z.boolean().optional(), weeks: z.number().int().min(4).max(24).optional() }).optional(), async ({ userId, body }) => { const p = await generateAndSaveProgramme(userId, { continueFrom: body?.continueFrom, weeks: body?.weeks }); return { id: p.id, name: p.name }; });

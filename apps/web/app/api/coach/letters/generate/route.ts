import { z } from "zod";
import { generateWeeklyLetter } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ weekStartsOn: z.string().date().optional(), email: z.boolean().optional(), force: z.boolean().optional() }).optional(), async ({ userId, body }) => generateWeeklyLetter(userId, body?.weekStartsOn, { email: body?.email, force: body?.force }));

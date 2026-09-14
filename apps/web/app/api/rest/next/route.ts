import { z } from "zod";
import { nextRestContent } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(z.object({ exclude: z.string().optional() }), async ({ userId, body }) => nextRestContent(userId, (body.exclude ?? "").split(",").filter(Boolean).slice(0, 200)));

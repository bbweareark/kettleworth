import { z } from "zod";
import { completeSideQuest } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ id: z.string().uuid() }), async ({ userId, body }) => completeSideQuest(userId, body.id));

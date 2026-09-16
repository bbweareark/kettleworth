import { z } from "zod";
import { answerSessionQuest } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ answer: z.enum(["done", "not_yet", "swap"]) }), async ({ userId, body }) => answerSessionQuest(userId, body.answer));

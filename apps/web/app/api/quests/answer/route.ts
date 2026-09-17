import { z } from "zod";
import { answerSessionQuest } from "@kettleworth/api";
import { route } from "@/lib/api";
import { localTodayIso, localTimeZone } from "@/lib/local-date";
export const POST = route(z.object({ answer: z.enum(["done", "not_yet", "swap"]) }), async ({ userId, body }) => answerSessionQuest(userId, body.answer, await localTodayIso(), await localTimeZone()));

import { z } from "zod";
import { coachChat, coachHistory } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId }) => coachHistory(userId));
export const POST = route(z.object({ message: z.string().min(1).max(1000) }), async ({ userId, body }) => coachChat(userId, body.message));

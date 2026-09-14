import { z } from "zod";
import { joinChallenge } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ challengeId: z.string().uuid(), join: z.boolean() }), async ({ userId, body }) => { await joinChallenge(userId, body.challengeId, body.join); });

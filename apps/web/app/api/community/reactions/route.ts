import { z } from "zod";
import { toggleReaction } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ postId: z.string().uuid() }), async ({ userId, body }) => toggleReaction(userId, body.postId));

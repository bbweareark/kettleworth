import { z } from "zod";
import { addComment } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ postId: z.string().uuid(), body: z.string().min(1).max(1000) }), async ({ userId, body }) => addComment(userId, body.postId, body.body));

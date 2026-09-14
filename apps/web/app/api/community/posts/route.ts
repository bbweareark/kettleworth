import { z } from "zod";
import { createPost } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ groupId: z.string().uuid(), body: z.string().min(1).max(2000), kind: z.enum(["text", "workout", "progress", "pr"]).default("text") }), async ({ userId, body }) => createPost(userId, body.groupId, body.body, body.kind));

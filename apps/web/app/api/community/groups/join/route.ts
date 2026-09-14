import { z } from "zod";
import { joinGroup } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ groupId: z.string().uuid(), join: z.boolean() }), async ({ userId, body }) => { await joinGroup(userId, body.groupId, body.join); });

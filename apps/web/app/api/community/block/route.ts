import { z } from "zod";
import { blockUser } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ userId: z.string(), on: z.boolean().default(true) }), async ({ userId, body }) => { await blockUser(userId, body.userId, body.on); });

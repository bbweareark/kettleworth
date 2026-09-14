import { z } from "zod";
import { requestPartner } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ userId: z.string() }), async ({ userId, body }) => requestPartner(userId, body.userId));

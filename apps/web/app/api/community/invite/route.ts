import { z } from "zod";
import { acceptInvite, inviteToken } from "@kettleworth/api";
import { route } from "@/lib/api";

/** The link a member shares with someone they already train with. */
export const GET = route(undefined, async ({ userId }) => ({ token: await inviteToken(userId) }));

/** The other side accepting it. Both have consented by the time this runs. */
export const POST = route(z.object({ token: z.string().min(5).max(80) }), async ({ userId, body }) => acceptInvite(userId, body.token));

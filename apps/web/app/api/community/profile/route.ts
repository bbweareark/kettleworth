import { z } from "zod";
import { getCommunityProfile, upsertCommunityProfile } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId }) => ({ profile: await getCommunityProfile(userId) }));
export const POST = route(z.object({ handle: z.string().min(3).max(24), displayName: z.string().min(1).max(40), bio: z.string().max(200).nullable().optional(), city: z.string().max(60).nullable().optional(), country: z.string().max(60).nullable().optional(), trainTogether: z.boolean().default(false), visibility: z.enum(["public", "members", "private"]).default("private") }), async ({ userId, body }) => ({ profile: await upsertCommunityProfile(userId, body) }));

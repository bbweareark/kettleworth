import { z } from "zod";
import { MAX_USER_TEXT } from "@kettleworth/core";
import { TrainingProfile } from "@kettleworth/types";
import { getProfile, upsertProfile } from "@kettleworth/api";
import { route } from "@/lib/api";

/*
 * The transcript and the profile both go straight into prompts we pay for (ai/tasks.ts
 * interpolates `transcript.slice(-12)` and `JSON.stringify(profile)`), and both were
 * unbounded here: an array of any length of strings of any length. Capping the three fields
 * the follow-up route takes was not enough while this door was open, because a PATCH here
 * and a valid POST there buy the same six-figure prompt. 200 turns is far more than an
 * intake has ever produced; `.slice(-12)` only ever reads the last twelve.
 */
export const GET = route(undefined, async ({ userId }) => (await getProfile(userId)) ?? { profile: null });
export const PATCH = route(z.object({ patch: TrainingProfile.partial(), step: z.number().int().optional(), transcript: z.array(z.object({ role: z.enum(["coach", "user"]), text: z.string().max(MAX_USER_TEXT), at: z.string().max(40) })).max(200).optional() }), async ({ userId, body }) => upsertProfile(userId, body.patch, { step: body.step, transcript: body.transcript }));

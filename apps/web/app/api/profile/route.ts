import { z } from "zod";
import { TrainingProfile } from "@kettleworth/types";
import { getProfile, upsertProfile } from "@kettleworth/api";
import { route } from "@/lib/api";

export const GET = route(undefined, async ({ userId }) => (await getProfile(userId)) ?? { profile: null });
export const PATCH = route(z.object({ patch: TrainingProfile.partial(), step: z.number().int().optional(), transcript: z.array(z.object({ role: z.enum(["coach", "user"]), text: z.string(), at: z.string() })).optional() }), async ({ userId, body }) => upsertProfile(userId, body.patch, { step: body.step, transcript: body.transcript }));

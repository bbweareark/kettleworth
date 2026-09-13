import { z } from "zod";
import { swapExercise } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ toExerciseId: z.string(), reason: z.string().max(200).nullable().optional(), permanent: z.boolean().optional() }), async ({ userId, params, body }) => swapExercise(userId, params.id!, body.toExerciseId, body.reason ?? null, body.permanent ?? false));

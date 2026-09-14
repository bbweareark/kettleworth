import { z } from "zod";
import { setLifeMode } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ mode: z.enum(["normal", "travel", "ill", "injured", "busy", "newborn"]), until: z.string().date().nullable().optional(), note: z.string().max(200).optional() }), async ({ userId, body }) => { await setLifeMode(userId, body.mode, body.until ?? null, body.note); return { ok: true }; });

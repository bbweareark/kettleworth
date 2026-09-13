import { skipSession } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId, params }) => { await skipSession(userId, params.id!); return { ok: true }; });

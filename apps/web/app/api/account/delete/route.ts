import { z } from "zod";
import { deleteAccount } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ confirm: z.literal("DELETE") }), async ({ userId }) => { await deleteAccount(userId); return { ok: true }; });

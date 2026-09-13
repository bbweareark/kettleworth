import { HealthProvider } from "@kettleworth/types";
import { disconnectProvider } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId, params }) => { await disconnectProvider(userId, HealthProvider.parse(params.provider)); return { ok: true }; });

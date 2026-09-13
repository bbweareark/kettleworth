import { startSession } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId, params }) => startSession(userId, params.id!));

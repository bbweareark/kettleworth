import { resetSession } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId, params }) => resetSession(userId, params.id!));

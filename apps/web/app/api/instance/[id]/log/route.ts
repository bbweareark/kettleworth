import { LoggedSet } from "@kettleworth/types";
import { logSet } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(LoggedSet, async ({ userId, params, body }) => logSet(userId, params.id!, body));

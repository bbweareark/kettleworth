import { deleteFoodEntry } from "@kettleworth/api";
import { route } from "@/lib/api";
export const DELETE = route(undefined, async ({ userId, params }) => { await deleteFoodEntry(userId, params.id!); });

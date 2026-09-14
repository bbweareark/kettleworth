import { resetInstance } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId, params }) => resetInstance(userId, params.id!));

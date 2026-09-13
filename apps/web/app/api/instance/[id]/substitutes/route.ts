import { substitutesForInstance } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId, params }) => substitutesForInstance(userId, params.id!));

import { findMatches } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId }) => findMatches(userId));

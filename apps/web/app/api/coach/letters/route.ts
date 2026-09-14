import { listLetters } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId }) => listLetters(userId));

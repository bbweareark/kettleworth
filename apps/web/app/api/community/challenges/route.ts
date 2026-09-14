import { listChallenges } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(undefined, async ({ userId }) => ({ challenges: await listChallenges(userId) }));

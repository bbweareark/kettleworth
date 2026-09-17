import { questBoard } from "@kettleworth/api";
import { route } from "@/lib/api";
import { localTodayIso, localTimeZone } from "@/lib/local-date";
export const GET = route(undefined, async ({ userId }) => questBoard(userId, await localTodayIso(), await localTimeZone()));

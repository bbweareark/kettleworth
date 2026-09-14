import { z } from "zod";
import { weeklyCheckIn } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ choice: z.enum(["keep", "fresh", "ease"]) }), async ({ userId, body }) => weeklyCheckIn(userId, body.choice));

import { z } from "zod";
import { analysePhotos } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ ids: z.array(z.string()).min(1).max(3) }), async ({ userId, body }) => analysePhotos(userId, body.ids));

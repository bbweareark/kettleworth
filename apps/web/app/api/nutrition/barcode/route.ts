import { z } from "zod";
import { lookupBarcode } from "@kettleworth/api";
import { route } from "@/lib/api";
export const GET = route(z.object({ code: z.string().min(8).max(20) }), async ({ body }) => ({ product: await lookupBarcode(body.code) }));

import { z } from "zod";
import { estimateFood } from "@kettleworth/api";
import { route } from "@/lib/api";
export const maxDuration = 60;
const Body = z.object({
  text: z.string().trim().min(2).max(400).optional(),
  image: z.object({ data: z.string().min(100).max(8_000_000), mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]) }).optional(),
}).refine((b) => b.text || b.image, { message: "Describe it or add a photo" });
export const POST = route(Body, async ({ userId, body }) => estimateFood(userId, body));

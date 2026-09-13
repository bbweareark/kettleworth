import { z } from "zod";
import { addMeasurement, addManualSample } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ measuredOn: z.string().date(), weightKg: z.number().min(20).max(400).nullable().optional(), bodyFatPct: z.number().min(2).max(70).nullable().optional(), waistCm: z.number().nullable().optional(), hipCm: z.number().nullable().optional(), chestCm: z.number().nullable().optional(), armCm: z.number().nullable().optional(), thighCm: z.number().nullable().optional(), sleepHours: z.number().min(0).max(16).nullable().optional() }), async ({ userId, body }) => {
  const { sleepHours, ...m } = body;
  const row = await addMeasurement(userId, m);
  if (m.weightKg) await addManualSample(userId, "body_weight", m.weightKg, "kg", new Date(m.measuredOn));
  if (sleepHours) await addManualSample(userId, "sleep_duration", sleepHours * 60, "min", new Date(m.measuredOn));
  return row;
});

import { z } from "zod";
import { HealthMetric, HealthProvider } from "@kettleworth/types";
import { setEnabledMetrics } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ metrics: z.array(HealthMetric) }), async ({ userId, params, body }) => { await setEnabledMetrics(userId, HealthProvider.parse(params.provider), body.metrics); return { ok: true }; });

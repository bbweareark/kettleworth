import { z } from "zod";
import { NextResponse } from "next/server";
import { HealthMetric } from "@kettleworth/types";
import { beginConnect } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(z.object({ metrics: z.array(HealthMetric) }), async ({ userId, params, body, req }) => {
  const origin = process.env.BETTER_AUTH_URL ?? new URL(req.url).origin;
  const url = await beginConnect(userId, params.provider!, `${origin}/api/integrations/${params.provider}/callback`, body.metrics);
  return NextResponse.json({ url });
});

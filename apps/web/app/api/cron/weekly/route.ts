import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, profile } from "@kettleworth/db";
import { generateWeeklyLetter, runWeeklyAdaptation } from "@kettleworth/api";

/** Sunday evening job: generate and email every onboarded user's letter. Protect with CRON_SECRET (Vercel Cron sends it as a bearer token). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const users = await db().select({ userId: profile.userId }).from(profile).where(eq(profile.onboardingStep, profile.onboardingStep));
  let sent = 0, failed = 0;
  for (const u of users) { try { await runWeeklyAdaptation(u.userId).catch(() => null); await generateWeeklyLetter(u.userId, undefined, { email: true }); sent++; } catch { failed++; } }
  return NextResponse.json({ sent, failed });
}

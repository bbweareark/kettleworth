import { NextResponse } from "next/server";
import { isNotNull } from "drizzle-orm";
import { db, profile } from "@kettleworth/db";
import { cronAuthorised } from "@kettleworth/core";
import { generateWeeklyLetter, runWeeklyAdaptation } from "@kettleworth/api";

/**
 * Sunday evening job: generate and email the weekly letter.
 *
 * Two things here were wrong and both let a stranger spend money.
 *
 * The guard read `if (secret && ...)`, which looks like a check and behaves like an
 * invitation: `CRON_SECRET` is not in the required set, so with it unset the condition was
 * false and any unauthenticated GET ran the whole fan-out - one top-tier model call and one
 * email per account, plus a rewrite of every user's planned sets. A missing secret now
 * closes the door rather than removing it; see `cronAuthorised`.
 *
 * And the selection was `where(eq(profile.onboardingStep, profile.onboardingStep))`, a
 * column compared with itself, which is every row. Accounts that opened the app once and
 * never finished intake were getting a paid letter about a week they did not train, every
 * week, for ever. The owner's rule is that a letter goes to somebody who finished intake.
 */
export async function GET(req: Request) {
  if (!cronAuthorised(process.env.CRON_SECRET, req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const users = await db().select({ userId: profile.userId }).from(profile).where(isNotNull(profile.onboardingCompletedAt));
  let sent = 0, failed = 0;
  for (const u of users) { try { await runWeeklyAdaptation(u.userId).catch(() => null); await generateWeeklyLetter(u.userId, undefined, { email: true }); sent++; } catch { failed++; } }
  return NextResponse.json({ sent, failed });
}

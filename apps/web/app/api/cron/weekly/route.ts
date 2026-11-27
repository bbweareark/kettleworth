import { NextResponse, after } from "next/server";
import { and, eq, exists, gt, gte, isNotNull, or, sql } from "drizzle-orm";
import { db, profile, session, trainingSession, coachMessage } from "@kettleworth/db";
import { cronAuthorised } from "@kettleworth/core";
import { generateWeeklyLetter, runWeeklyAdaptation } from "@kettleworth/api";

/**
 * Monday morning job: weekly adaptation plus the Sunday letter, emailed.
 *
 * Scope and shape (ARCHITECTURE.md, Phase B): only users who finished onboarding and were active in the last
 * CRON_ACTIVE_DAYS days (default 0 = everyone who finished intake, which is the owner's rule), in batches of CRON_BATCH (default 200) ordered by user id.
 * Each batch is its own invocation: when a batch is full the handler schedules the next one by calling itself
 * with ?cursor=<last user id> after the response is sent, so no single call has to finish a million users.
 * CRON_BATCHED=off processes everyone in one call (the old behaviour, for small installs).
 * Protect with CRON_SECRET. The guard used to read `if (secret && ...)`, which looks like a check and behaves
 * like an invitation: CRON_SECRET is not in the required set, so with it unset any unauthenticated GET ran the
 * whole fan-out. A missing secret now closes the door rather than removing it, which also means the chained
 * call below cannot run without one.
 */
/*
 * A batch is 200 users and each one is an AI call awaited in turn, so the invocation needs a
 * budget far larger than a page render's. This is the platform maximum on the current plan;
 * it is still not enough for 200 serial top-tier calls, which is why CRON_BATCH exists and
 * why the real answer - a queue, so the calls are not serial at all - is in the record as
 * open rather than claimed as fixed here.
 */
export const maxDuration = 800;

const OFF = new Set(["off", "0", "false", "no"]);
const flag = (name: string, dflt = true) => { const v = process.env[name]?.trim().toLowerCase(); return v == null || v === "" ? dflt : !OFF.has(v); };
const num = (name: string, dflt: number) => { const v = Number(process.env[name]); return process.env[name] && Number.isFinite(v) && v >= 0 ? v : dflt; };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!cronAuthorised(secret, req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const activeDays = num("CRON_ACTIVE_DAYS", 0);
  const batch = Math.max(1, Math.floor(num("CRON_BATCH", 200)));
  const chained = flag("CRON_BATCHED");
  const cutoff = new Date(Date.now() - activeDays * 86_400_000);

  const conditions = [isNotNull(profile.onboardingCompletedAt)];
  if (cursor) conditions.push(gt(profile.userId, cursor));
  if (activeDays > 0) {
    // Active = signed in, logged a session, or talked to the coach within the window.
    conditions.push(or(
      exists(db().select({ one: sql`1` }).from(session).where(and(eq(session.userId, profile.userId), gte(session.updatedAt, cutoff)))),
      exists(db().select({ one: sql`1` }).from(trainingSession).where(and(eq(trainingSession.userId, profile.userId), gte(trainingSession.completedAt, cutoff)))),
      exists(db().select({ one: sql`1` }).from(coachMessage).where(and(eq(coachMessage.userId, profile.userId), gte(coachMessage.createdAt, cutoff)))),
    )!);
  }
  const query = db().select({ userId: profile.userId }).from(profile).where(and(...conditions)).orderBy(profile.userId);
  const rows = chained ? await query.limit(batch + 1) : await query;
  const page = chained ? rows.slice(0, batch) : rows;
  const next = chained && rows.length > batch ? page[page.length - 1]!.userId : null;

  let sent = 0, failed = 0;
  for (const u of page) {
    try {
      await runWeeklyAdaptation(u.userId).catch(() => null);
      await generateWeeklyLetter(u.userId, undefined, { email: true });
      sent++;
    } catch (e) {
      failed++;
      console.warn(`[cron:weekly] ${u.userId} failed`, e);
    }
  }

  if (next) {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("cursor", next);
    after(() => fetch(nextUrl, { headers: { authorization: `Bearer ${secret}` } }).then((r) => { if (!r.ok) console.warn(`[cron:weekly] chained batch returned ${r.status}`); }).catch((e) => console.warn("[cron:weekly] chained batch failed", e)));
  }
  return NextResponse.json({ sent, failed, batch: page.length, next, activeDays, cursor });
}

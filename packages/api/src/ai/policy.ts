import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db, aiLog } from "@kettleworth/db";
import { entitlements } from "../services/entitlements";

/**
 * AI spend policy: which model a task runs on, who may run it, and how much each user may use per month.
 *
 * Why this exists: with one Opus-class model for every task and every user, the LLM line was 97% of the
 * projected bill at 1,000,000 users and eleven times revenue (see ARCHITECTURE.md, gate 3). Three levers
 * fix it without touching any product path, because every task already has a deterministic fallback:
 *   1. per-task model tier (routine / standard / premium) - AI_TIERING=off restores the single model
 *   2. entitlement gate - tasks marked aiCoach run only for users whose plan includes the AI coach
 *   3. per-user monthly cap on calls and tokens - AI_GATING=off disables both the gate and the cap
 */
export type Tier = "routine" | "standard" | "premium";
export type Access = "all" | "aiCoach";
export type TaskPolicy = { tier: Tier; access: Access };
export type Env = Record<string, string | undefined>;

export const TASK_POLICIES: Record<string, TaskPolicy> = {
  // Onboarding and safety: cheap model, open to everyone. Injury and medical extraction must not depend on plan.
  intake_followup: { tier: "routine", access: "all" },
  intake_extract: { tier: "routine", access: "all" },
  profile_summary: { tier: "routine", access: "all" },
  // Shared content batch cached for all users; the requesting user is incidental.
  rest_content: { tier: "routine", access: "all" },
  // Coaching surfaces: part of the paid plan.
  meal_plan_note: { tier: "routine", access: "aiCoach" },
  food_text_estimate: { tier: "routine", access: "aiCoach" },
  food_photo_estimate: { tier: "standard", access: "aiCoach" },
  programme_note: { tier: "standard", access: "aiCoach" },
  weekly_letter: { tier: "standard", access: "aiCoach" },
  coach_chat: { tier: "standard", access: "aiCoach" },
  body_photo_analysis: { tier: "premium", access: "aiCoach" },
};
export const DEFAULT_POLICY: TaskPolicy = { tier: "standard", access: "aiCoach" };

export function policyFor(task: string): TaskPolicy {
  return TASK_POLICIES[task] ?? DEFAULT_POLICY;
}

const OFF = new Set(["off", "0", "false", "no"]);
function flag(env: Env, name: string, dflt = true): boolean {
  const v = env[name]?.trim().toLowerCase();
  return v == null || v === "" ? dflt : !OFF.has(v);
}
function num(env: Env, name: string, dflt: number): number {
  const v = Number(env[name]);
  return env[name] != null && env[name] !== "" && Number.isFinite(v) && v >= 0 ? v : dflt;
}
export const tieringEnabled = (env: Env = process.env) => flag(env, "AI_TIERING");
export const gatingEnabled = (env: Env = process.env) => flag(env, "AI_GATING");

/** Model id for a tier. The premium model is AI_MODEL, so existing deployments keep their configured model for premium work. */
export function modelFor(tier: Tier, env: Env = process.env): string {
  const premium = env.AI_MODEL ?? "claude-opus-5";
  if (!tieringEnabled(env)) return premium;
  if (tier === "routine") return env.AI_MODEL_ROUTINE ?? "claude-haiku-5-5";
  if (tier === "standard") return env.AI_MODEL_STANDARD ?? "claude-sonnet-5-5";
  return premium;
}

export type Caps = { calls: number; tokens: number }; // 0 means unlimited
export type Usage = { calls: number; tokens: number };
export function capsFor(planTier: "free" | "premium", env: Env = process.env): Caps {
  return planTier === "premium"
    ? { calls: num(env, "AI_CAP_PREMIUM_CALLS", 600), tokens: num(env, "AI_CAP_PREMIUM_TOKENS", 3_000_000) }
    : { calls: num(env, "AI_CAP_FREE_CALLS", 40), tokens: num(env, "AI_CAP_FREE_TOKENS", 200_000) };
}

export type Decision =
  | { allow: true; model: string; tier: Tier }
  | { allow: false; reason: "gated" | "cap_calls" | "cap_tokens"; model: string; tier: Tier };

/** Pure decision: no database, no clock. `usage` is this user's month to date, or null when the cap is not being enforced. */
export function decide(task: string, ent: { tier: "free" | "premium"; aiCoach: boolean }, usage: Usage | null, env: Env = process.env): Decision {
  const policy = policyFor(task);
  const model = modelFor(policy.tier, env);
  if (!gatingEnabled(env)) return { allow: true, model, tier: policy.tier };
  if (policy.access === "aiCoach" && !ent.aiCoach) return { allow: false, reason: "gated", model, tier: policy.tier };
  if (usage) {
    const caps = capsFor(ent.tier, env);
    if (caps.calls > 0 && usage.calls >= caps.calls) return { allow: false, reason: "cap_calls", model, tier: policy.tier };
    if (caps.tokens > 0 && usage.tokens >= caps.tokens) return { allow: false, reason: "cap_tokens", model, tier: policy.tier };
  }
  return { allow: true, model, tier: policy.tier };
}

/** First instant of the calendar month in UTC; caps reset on the 1st. */
export function monthStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Rows written by skipped calls carry this model so they never count towards usage. */
export const SKIPPED_MODEL = "none";

export async function monthlyUsage(userId: string, now: Date = new Date()): Promise<Usage> {
  const [row] = await db()
    .select({ calls: sql<number>`count(*)::int`, tokens: sql<number>`coalesce(sum(coalesce(${aiLog.inputTokens}, 0) + coalesce(${aiLog.outputTokens}, 0)), 0)::int` })
    .from(aiLog)
    .where(and(eq(aiLog.userId, userId), gte(aiLog.createdAt, monthStart(now)), ne(aiLog.model, SKIPPED_MODEL)));
  return { calls: row?.calls ?? 0, tokens: row?.tokens ?? 0 };
}

/** The decision for one call. System tasks with no user are tiered but never gated or capped. */
export async function authorise(task: string, userId: string | null | undefined, env: Env = process.env): Promise<Decision> {
  const policy = policyFor(task);
  if (!userId) return { allow: true, model: modelFor(policy.tier, env), tier: policy.tier };
  let ent: { tier: "free" | "premium"; aiCoach: boolean };
  try {
    const e = await entitlements(userId);
    ent = { tier: e.tier, aiCoach: e.aiCoach };
  } catch (err) {
    // The subscription lookup failing must not take the product down; behave as billing-off would.
    console.warn("entitlements lookup failed, treating as free", err);
    ent = { tier: "free", aiCoach: env.BILLING_ENFORCED !== "true" };
  }
  let usage: Usage | null = null;
  if (gatingEnabled(env)) {
    try { usage = await monthlyUsage(userId); } catch (err) { console.warn("ai usage lookup failed, cap not applied", err); }
  }
  return decide(task, ent, usage, env);
}

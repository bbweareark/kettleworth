import { eq } from "drizzle-orm";
import { db, subscription } from "@kettleworth/db";

export type Entitlements = { tier: "free" | "premium"; unlimitedProgrammes: boolean; nutrition: boolean; community: boolean; integrations: boolean; /** AI coaching surfaces (letters, chat, notes, photo and food analysis). Free users get the deterministic paths. */ aiCoach: boolean };
/** Everything is unlocked until BILLING_ENFORCED=true. This is the single gate to flip; the AI policy in ../ai/policy.ts reads aiCoach from it. */
export async function entitlements(userId: string): Promise<Entitlements> {
  const [row] = await db().select().from(subscription).where(eq(subscription.userId, userId)).limit(1);
  const tier = row?.tier ?? "free";
  const billingEnabled = process.env.BILLING_ENFORCED === "true";
  const premium = !billingEnabled || tier === "premium";
  return { tier, unlimitedProgrammes: premium, nutrition: premium, community: premium, integrations: premium, aiCoach: premium };
}

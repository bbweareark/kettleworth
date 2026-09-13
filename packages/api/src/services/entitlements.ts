import { eq } from "drizzle-orm";
import { db, subscription } from "@kettleworth/db";

export type Entitlements = { tier: "free" | "premium"; unlimitedProgrammes: boolean; nutrition: boolean; community: boolean; integrations: boolean };
/** Everything is unlocked for now (billing arrives in Phase 1.5). This is the single gate to flip. */
export async function entitlements(userId: string): Promise<Entitlements> {
  const [row] = await db().select().from(subscription).where(eq(subscription.userId, userId)).limit(1);
  const tier = row?.tier ?? "free";
  const billingEnabled = process.env.BILLING_ENFORCED === "true";
  const premium = !billingEnabled || tier === "premium";
  return { tier, unlimitedProgrammes: premium, nutrition: premium, community: premium, integrations: premium };
}

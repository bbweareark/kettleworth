import { z } from "zod";
import { generateWeeklyLetter } from "@kettleworth/api";
import { route } from "@/lib/api";

/*
 * Generate this week's letter.
 *
 * The schema used to be the service's own options bag, forwarded whole, which handed the
 * client two things it should never have had.
 *
 * `email: true` made the server send mail on demand. No client ever set it, only the cron
 * needs it, and it was reachable by anyone who could POST. It is gone from the surface and
 * set server-side by the cron.
 *
 * `force` defeated the only idempotency a paid, top-tier generation had: the same account
 * could ask for the same letter without limit and be billed every time. It is gone too, and
 * that is a deliberately blunt answer. A per-week budget would be the kind one, but
 * `coach_letter` has only `created_at` and the write is an upsert that leaves it alone, so
 * there is no timestamp that moves and no time-based rule that holds. Adding one is a schema
 * change, which is escalated in SHIP-READINESS.md rather than smuggled in here.
 *
 * What a member loses: pressing the button twice now returns the letter they already have
 * instead of buying a second one. What they keep: a letter a week, which is what the
 * document is.
 */
export const POST = route(z.object({ weekStartsOn: z.string().date().optional() }).optional(), async ({ userId, body }) =>
  generateWeeklyLetter(userId, body?.weekStartsOn));

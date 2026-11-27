/**
 * The bounds.
 *
 * Four of the seven blockers in SHIP-READINESS.md are the same defect wearing different
 * clothes: something a stranger controls has no ceiling. How much text they can push into a
 * prompt we pay for, how often they can make us regenerate a paid document, how many
 * megabytes they can write into the primary database, and whether the weekly job is
 * protected at all when its secret is missing.
 *
 * The rules live here, as pure functions, for the reason everything else in this package
 * does: a limit that is only enforced at a call site is a limit nobody can test, and the
 * first new call site goes around it. The wiring is in `packages/api` and `apps/web`; what
 * is correct is here, with the tests.
 */

/**
 * The longest free-text field we will ever hand to a model.
 *
 * 2,000 characters is not arbitrary: it is the cap `TrainingProfile.notes` already carries,
 * so it is the size this product has already decided a person's own words can be. The intake
 * UI sends a sentence or two, so a real answer never meets this.
 */
export const MAX_USER_TEXT = 2000;

/**
 * Cut a user-supplied string to something a prompt can afford.
 *
 * Truncates rather than rejects. This runs on an answer somebody typed during intake, and
 * losing the tail of an overlong answer is a far better outcome than losing the answer.
 */
export function capUserText(s: string, max = MAX_USER_TEXT): string {
  return s.length <= max ? s : s.slice(0, max);
}

/**
 * Is this request allowed to run the weekly job?
 *
 * The old check was `if (secret && header !== secret) refuse`, which reads as a guard and
 * behaves as an invitation: with `CRON_SECRET` unset - and it is not in `.env.example`'s
 * required set - the condition is false and every unauthenticated GET runs the whole
 * fan-out, rewriting every user's planned sets and sending every user an email.
 *
 * A missing secret now closes the door rather than removing it. The job is a scheduled
 * machine caller; there is no case where "no secret configured" should mean "open to the
 * internet".
 */
export function cronAuthorised(secret: string | undefined, header: string | null): boolean {
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}

/** A week, in milliseconds. */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * May this user force a paid document to be regenerated?
 *
 * `force` exists so somebody who has just logged a session can ask for a letter that knows
 * about it. It was reachable from the client with no bound at all, which turned the one
 * piece of idempotency the paid AI tasks had into a suggestion: the same account could ask
 * for the same letter a thousand times and be billed a thousand times.
 *
 * The flag survives, because the reason for it is real. What it costs is now once a week,
 * which is the cadence the document itself has.
 */
export function mayRegenerate(lastGeneratedAt: Date | null | undefined, now: Date = new Date()): boolean {
  if (!lastGeneratedAt) return true;
  return now.getTime() - lastGeneratedAt.getTime() >= WEEK_MS;
}

/**
 * What one account may store in progress photographs.
 *
 * Photographs are `bytea` in the primary Postgres, so this is not the account's quota, it is
 * everybody's: the rows share a database with every query the app makes, and Neon bills the
 * storage. At 8 MB a file and no ceiling, one free signup could write until the disk filled.
 *
 * 60 photographs is roughly a year of weekly progress shots from three angles, and 200 MB is
 * what those weigh at a realistic size. Both are deliberately generous for a person and
 * useless to somebody filling a disk.
 */
export const PHOTO_QUOTA = { count: 60, bytes: 200 * 1024 * 1024 } as const;

export type PhotoUsage = { count: number; bytes: number };

/**
 * Whether one more photograph of this size fits. Returns the reason when it does not, so the
 * caller can say which ceiling was met rather than "upload failed".
 */
export function photoQuotaCheck(used: PhotoUsage, incomingBytes: number, quota: PhotoUsage = PHOTO_QUOTA): { ok: true } | { ok: false; reason: string } {
  if (used.count + 1 > quota.count) {
    return { ok: false, reason: `You have ${used.count} photos saved, which is the limit. Delete one to add another.` };
  }
  if (used.bytes + incomingBytes > quota.bytes) {
    const mb = Math.round(quota.bytes / (1024 * 1024));
    return { ok: false, reason: `Your photos would go over ${mb} MB. Delete one to add another.` };
  }
  return { ok: true };
}

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
 * Used as the `.max()` on every route schema that feeds a prompt. It is a constant rather
 * than a truncating helper on purpose: a request that is too big should be refused at the
 * edge with a 400 somebody can see, not silently cut in half and billed for the half.
 *
 * 2,000 characters is not arbitrary: it is the cap `TrainingProfile.notes` already carries,
 * so it is the size this product has already decided a person's own words can be. The intake
 * UI sends a sentence or two, so a real answer never meets this.
 */
export const MAX_USER_TEXT = 2000;

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

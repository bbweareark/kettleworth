import { describe, expect, it } from "vitest";
import { cronAuthorised, photoQuotaCheck, MAX_USER_TEXT, PHOTO_QUOTA } from "./limits";

/*
 * Each of these is red against the code as it was. They are written as the attack rather
 * than as the happy path, because the happy path was never the problem: every one of these
 * four defects let a request through that should have been refused.
 */

describe("cron authorisation", () => {
  it("refuses an unauthenticated request when no secret is configured", () => {
    // The old guard was `if (secret && header !== secret)`, so this case returned true and
    // the whole weekly fan-out ran for anyone who sent a GET.
    expect(cronAuthorised(undefined, null)).toBe(false);
    expect(cronAuthorised("", null)).toBe(false);
    expect(cronAuthorised(undefined, "Bearer anything")).toBe(false);
  });

  it("accepts only the configured bearer token", () => {
    expect(cronAuthorised("s3cret", "Bearer s3cret")).toBe(true);
    expect(cronAuthorised("s3cret", "Bearer wrong")).toBe(false);
    expect(cronAuthorised("s3cret", "s3cret")).toBe(false);
    expect(cronAuthorised("s3cret", null)).toBe(false);
  });
});

describe("the cap on user text going into a prompt", () => {
  it("is the size the profile already allows for a person's own words", () => {
    // Load-bearing: the route schemas import this constant as their .max().
    expect(MAX_USER_TEXT).toBe(2000);
  });
});

describe("progress photo quota", () => {
  const MB = 1024 * 1024;

  it("lets an ordinary upload through", () => {
    expect(photoQuotaCheck({ count: 12, bytes: 40 * MB }, 3 * MB).ok).toBe(true);
  });

  it("stops the account that is filling the database", () => {
    // 8 MB a file with no ceiling was the finding: this is the 61st photo.
    const r = photoQuotaCheck({ count: PHOTO_QUOTA.count, bytes: 10 * MB }, 1 * MB);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/limit/i);
  });

  it("stops on total bytes even when the count is fine", () => {
    const r = photoQuotaCheck({ count: 3, bytes: PHOTO_QUOTA.bytes }, 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/MB/);
  });

  it("counts the incoming photo, so the quota is a ceiling and not a floor", () => {
    expect(photoQuotaCheck({ count: PHOTO_QUOTA.count - 1, bytes: 0 }, 1).ok).toBe(true);
    expect(photoQuotaCheck({ count: PHOTO_QUOTA.count, bytes: 0 }, 1).ok).toBe(false);
    expect(photoQuotaCheck({ count: 0, bytes: PHOTO_QUOTA.bytes - 1 }, 1).ok).toBe(true);
    expect(photoQuotaCheck({ count: 0, bytes: PHOTO_QUOTA.bytes - 1 }, 2).ok).toBe(false);
  });
});

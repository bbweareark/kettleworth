import { test, expect } from "@playwright/test";

/*
 * Unique per worker, not just per millisecond: the two projects start together, and a
 * timestamp alone can collide, which surfaces as the second sign-up hanging rather than as a
 * readable "that email is taken".
 */
const email = `e2e-${Date.now()}-${process.env.TEST_PARALLEL_INDEX ?? "0"}-${Math.random().toString(36).slice(2, 7)}@kettleworth.test`;
const password = "correct-horse-battery";

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

test("landing renders and links to sign-up", async ({ page }) => {
  await page.goto("/");
  // The hero is a photograph with the block length carried beneath it as the page's figure,
  // and the week is still on the page as a table further down.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your first block");
  await expect(page.getByRole("table").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Start free" }).first()).toHaveAttribute("href", "/sign-up");
});

test("library search works publicly", async ({ page }) => {
  await page.goto("/library?q=squat");
  await expect(page.getByText(/results/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Back Squat/i }).first()).toBeVisible();
});

test("sign up → intake → programme → session logging", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/app\/onboarding/);

  // basics
  await page.getByPlaceholder("30").fill("31");
  await page.getByRole("button", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  // body
  await page.getByPlaceholder("178").fill("180");
  await page.getByPlaceholder("80").fill("82");
  await page.getByRole("button", { name: /Continue/ }).click();
  // experience
  await page.getByRole("button", { name: /Novice/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  // goals
  await page.getByRole("button", { name: "Build muscle", exact: true }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  // Remaining steps use defaults. When the AI coach is on it may ask a follow-up (which can take a few seconds to arrive); skip it.
  const settle = async () => {
    const deadline = Date.now() + 40_000;
    while (Date.now() < deadline) {
      const skip = page.getByRole("button", { name: "Skip" });
      if (await skip.isVisible().catch(() => false)) { await skip.click(); await page.waitForTimeout(400); continue; }
      const cont = page.getByRole("button", { name: /Continue|Build my programme/ });
      if ((await cont.isVisible().catch(() => false)) && (await cont.isEnabled().catch(() => false))) return;
      await page.waitForTimeout(300);
    }
  };
  await settle();
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: /Continue/ }).click();
    await settle();
  }
  await expect(page.getByText("Your baseline")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Build my programme/ }).click();
  await page.waitForURL(/\/app\/programme\/new/);
  await page.getByRole("button", { name: /Generate programme/ }).click();
  await page.waitForURL(/\/app\/programme$/, { timeout: 60_000 });
  // The programme's one number is the week of the block, so that is the page's heading; the
  // block's own name sits in the eyebrow above it.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Week of the block");
  await expect(page.getByText(/Programme ·/).first()).toBeVisible();

  // Today → start session → log a set
  await page.goto("/app");
  await page.getByRole("link", { name: /Start session/ }).click();
  await page.waitForURL(/\/app\/session\//);
  // The console is one figure and one keypad: tapping a quantity makes it the figure and
  // points the keys at it, so typing must land on the one that was tapped and not the other.
  const console_ = page.locator('section[aria-label="Log sets"]');
  await console_.getByRole("button", { name: /^Edit the reps/ }).click();
  await console_.getByRole("group", { name: /Enter the reps/ }).getByRole("button", { name: "8", exact: true }).click();
  await expect(console_.getByRole("button", { name: /^Edit the reps/ })).toHaveAttribute("aria-label", /currently 8/);
  await expect(console_.getByRole("button", { name: /^Edit the/ }).first()).toHaveAttribute("aria-label", /currently 0 /);
  await console_.getByRole("radio", { name: /^Right/ }).click();
  await console_.getByRole("button", { name: /^(Log set|Update set)$/ }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  // Logging advances the focus to the next set, so the commit button reads "Log set" again.
  // Assert the set track recorded the one just logged, which is the stronger check anyway.
  await expect(console_.getByRole("button", { name: /^set 1/i })).toContainText("×");
});

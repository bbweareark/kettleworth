import { test, expect } from "@playwright/test";

const email = `e2e-${Date.now()}@kettleworth.test`;
const password = "correct-horse-battery";

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

test("landing renders and links to sign-up", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Training built for");
  await expect(page.getByRole("link", { name: /Start free/ })).toBeVisible();
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Muscle");
  await expect(page.getByText("Week", { exact: true }).first()).toBeVisible();

  // Today → start session → log a set
  await page.goto("/app");
  await page.getByRole("link", { name: /Start session/ }).click();
  await page.waitForURL(/\/app\/session\//);
  const weight = page.getByRole("textbox", { name: /weight/i }).first();
  await weight.fill("40");
  await page.getByRole("textbox", { name: "Reps" }).first().fill("8");
  await page.getByRole("button", { name: "Log set" }).first().click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Update set" }).first()).toBeVisible();
});

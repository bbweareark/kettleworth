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

/*
 * A set landing has to be heard and seen, and both are easy to break without noticing: audio
 * fails silently by design, and a one-shot animation leaves nothing behind to assert on. So
 * the page is instrumented before it loads - a fake AudioContext that records every tone
 * started, and an observer that records the one-shot classes as they are added - and the
 * session test reads both back. Installed on `document`, not `documentElement`, which does
 * not exist yet when an init script runs.
 */
const landingProbe = `
window.__tones = [];
window.__fx = [];
class P { setValueAtTime(v){ this.value = v; return this; } exponentialRampToValueAtTime(){ return this; } }
class N { constructor(){ this.frequency = new P(); this.gain = new P(); } connect(){ return this; } start(){ if (this.frequency.value) window.__tones.push(this.frequency.value); } stop(){} }
window.AudioContext = window.webkitAudioContext = class {
  constructor(){ this.currentTime = 0; this.state = "running"; this.destination = {}; }
  createOscillator(){ return new N(); } createGain(){ return new N(); }
  resume(){ return Promise.resolve(); } close(){ return Promise.resolve(); }
};
const watch = /animate-strike-drag|animate-warm-rise|arc-flash|animate-impact-strike|animate-strike-settle/;
const note = (el) => { const c = typeof el.className === "string" ? el.className : ""; const m = c.match(watch); if (m) window.__fx.push(m[0]); };
new MutationObserver((rs) => {
  for (const r of rs) {
    if (r.type === "attributes" && r.target instanceof Element) note(r.target);
    for (const n of r.addedNodes) if (n instanceof Element) { note(n); n.querySelectorAll("*").forEach(note); }
  }
}).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
`;

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
  await page.addInitScript(landingProbe);
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
  // Logging advances the focus to the next set, so the commit button reads "Log set" again.
  // Assert the set track recorded the one just logged, which is the stronger check anyway.
  await expect(console_.getByRole("button", { name: /^set 1/i })).toContainText("×");

  /*
   * Rest: the clock and the next set, and nothing else. The deck that used to live here is
   * gone, so there is no tab strip inside the timer.
   */
  const timer = page.getByRole("timer");
  await expect(timer).toBeVisible();
  await expect(timer.getByText("Next up")).toBeVisible();
  await expect(timer.getByRole("tab")).toHaveCount(0);

  // The coach turns up in the corner for the set that just landed, and leaves on his own.
  await expect(page.getByText("Set logged")).toBeVisible();

  /*
   * And the set was heard and seen. This world is Carbon, so what should have happened is a
   * click and a tone, and a volt head dragged under the two numbers while they settle. The
   * sound is the half that fails silently, which is why it is asserted at all.
   */
  const landing = await page.evaluate(() => ({
    tones: (window as never as { __tones: number[] }).__tones,
    fx: [...new Set((window as never as { __fx: string[] }).__fx)],
  }));
  expect(landing.tones.length, "a set landing makes a sound").toBeGreaterThan(0);
  expect(landing.fx, "a set landing moves").toContain("animate-strike-drag");

  await expect(page.getByText("Set logged")).toBeHidden({ timeout: 10_000 });

  /*
   * And the clock must keep counting down while the rest of the screen is used. This is the
   * regression the owner reported: `onDone` was an inline arrow, so every render of the player
   * pushed the deadline forward and rest started again whenever anything was pressed.
   */
  const clock = async () => {
    const [m, s] = (await timer.locator("[data-clock]").innerText()).trim().split(":").map(Number);
    return m! * 60 + s!;
  };
  const started = await clock();
  await console_.getByRole("button", { name: /^Edit the reps/ }).click();
  await console_.getByRole("group", { name: /Enter the reps/ }).getByRole("button", { name: "9", exact: true }).click();
  await page.waitForTimeout(2_500);
  expect(await clock()).toBeLessThan(started);

  /*
   * And it survives the exercise change. This was the owner's second report - "when we hit
   * next exercise the timer's gone" - and it was literal: moving on cleared the rest state.
   * Rest belongs to the body, not to the exercise being left behind.
   */
  const beforeMove = await clock();
  await page.getByRole("button", { name: /Next exercise/ }).click();
  await expect(timer).toBeVisible();
  expect(await clock()).toBeLessThanOrEqual(beforeMove);
  // And it is still the dock, naming the first set of the movement now on screen.
  await expect(timer.getByText(/Next up . set 1 of/)).toBeVisible();

  /*
   * And the sound can be turned off. It is a device setting written straight to a cookie, the
   * way the theme is, because somebody reaching for this is usually reaching for it while the
   * app is making a noise they do not want, and a Save button is the wrong weight for that.
   */
  await page.goto("/app/settings");
  const soundControl = page.getByRole("radiogroup", { name: "Sound" });
  await expect(soundControl.getByRole("radio", { name: "On" })).toHaveAttribute("aria-checked", "true");
  await soundControl.getByRole("radio", { name: "Off" }).click();
  expect(await page.evaluate(() => document.cookie)).toContain("kw-sound=off");
  await page.reload();
  await expect(page.getByRole("radiogroup", { name: "Sound" }).getByRole("radio", { name: "Off" })).toHaveAttribute("aria-checked", "true");
});

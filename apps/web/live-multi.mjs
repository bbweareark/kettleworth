import { chromium } from "@playwright/test";
const out = process.argv[2];
const B = "https://kettleworth.vercel.app";
const email = `multi-check-${Date.now()}@kettleworth.test`;
const password = "correct-horse-battery";

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", e => console.log("PAGEERR", e.message.slice(0, 130)));

async function settle() {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const skip = page.getByRole("button", { name: "Skip" });
    if (await skip.isVisible().catch(() => false)) { await skip.click(); await page.waitForTimeout(400); continue; }
    const cont = page.getByRole("button", { name: /Continue|Build my programme/ });
    if ((await cont.isVisible().catch(() => false)) && (await cont.isEnabled().catch(() => false))) return;
    await page.waitForTimeout(300);
  }
}
console.log("account:", email);
await page.goto(B + "/sign-up");
await page.getByLabel("Name").fill("Multi Check");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill(password);
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/\/app\/onboarding/, { timeout: 60000 });
await page.getByPlaceholder("30").fill("31");
await page.getByRole("button", { name: "Male", exact: true }).click();
await page.getByRole("button", { name: /Continue/ }).click();
await page.getByPlaceholder("178").fill("180");
await page.getByPlaceholder("80").fill("82");
await page.getByRole("button", { name: /Continue/ }).click();
await page.getByRole("button", { name: /Novice/ }).click();
await page.getByRole("button", { name: /Continue/ }).click();
await page.getByRole("button", { name: "Build muscle", exact: true }).click();
await page.getByRole("button", { name: /Continue/ }).click();
await settle();
for (let i = 0; i < 8; i++) { await page.getByRole("button", { name: /Continue/ }).click(); await settle(); }
await page.getByRole("button", { name: /Build my programme/ }).click();
await page.waitForURL(/\/app\/programme\/new/, { timeout: 60000 });
await page.getByRole("button", { name: /Generate programme/ }).click();
await page.waitForURL(/\/app\/programme$/, { timeout: 90000 });
await page.waitForTimeout(3000);

// two distinct session ids from the programme page
const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/app/session/"]')]
  .map(a => a.getAttribute("href").split("/app/session/")[1]))].slice(0, 2));
console.log("sessions:", ids);
if (ids.length < 2) { console.log("need two sessions"); await b.close(); process.exit(1); }

// Session A gets 8 solves (must cap at 6); session B gets 3 (must all count).
const plan = [[ids[0], 8], [ids[1], 3]];
for (const [sid, n] of plan) {
  for (let i = 0; i < n; i++) {
    const r = await ctx.request.post(B + "/api/rest", { headers: { origin: B, "content-type": "application/json" },
      data: { sessionId: sid, kind: "drill", correct: true, detail: { points: 5 } } });
    if (r.status() !== 200) { console.log("post failed", r.status()); break; }
  }
  console.log(`wrote ${n} drill rows to session ${sid.slice(0, 8)}`);
}
console.log("expected: least(8,6) + least(3,6) = 6 + 3 = 9 solves -> 45 points");

await page.goto(B + "/app/progress"); await page.waitForTimeout(6000);
console.log("GROWTH:", await page.evaluate(() => {
  const t = document.body.innerText;
  const g = (l) => { const i = t.indexOf(l); return i < 0 ? `${l}=absent` : t.slice(i, i + l.length + 7).replace(/\n/g, "="); };
  return [g("Plate drill"), g("Rest deck")].join(" | ");
}));
await page.screenshot({ path: `${out}/live-multi.png` });
console.log("ACCOUNT_TO_DELETE", email);
await b.close();

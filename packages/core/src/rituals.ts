import type { TrainingProfile } from "@kettleworth/types";

export type Nudge = { id: string; text: string; tone: "ember" | "signal" | "sky" | "amber" | "neutral"; action?: { label: string; href: string } };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** What the app should say right now, from the rituals the user set. Pure: same inputs, same nudges. */
export function ritualNudges(profile: TrainingProfile, ctx: { now: Date; weighedInToday: boolean; photoThisWeek: boolean; sessionToday: boolean; sessionDone: boolean; letterUnread: boolean }): Nudge[] {
  const r = profile.rituals; const out: Nudge[] = [];
  const day = (ctx.now.getDay() + 6) % 7; const t = hm(ctx.now);
  if (r.weighInDay === day && !ctx.weighedInToday) out.push({ id: "weigh", text: `${DAYS[day]} is your weigh-in day. Same time, same scales, before food.`, tone: "sky", action: { label: "Log weight", href: "/app/progress" } });
  if (r.photoDay === day && !ctx.photoThisWeek) out.push({ id: "photo", text: "Body check day. Same light, same pose as last time.", tone: "sky", action: { label: "Add photos", href: "/app/progress" } });
  if (r.trainingWindow && ctx.sessionToday && !ctx.sessionDone) {
    if (t < r.trainingWindow.start) out.push({ id: "window-soon", text: `Your training window opens at ${r.trainingWindow.start}. Eat something with carbs about 90 minutes before.`, tone: "ember" });
    else if (t <= r.trainingWindow.end) out.push({ id: "window-open", text: `Training window open until ${r.trainingWindow.end}. Today's session is ready.`, tone: "ember", action: { label: "Start", href: "/app" } });
    else out.push({ id: "window-missed", text: "Your window has passed. A shorter session still counts: drop the accessories and do the main lifts.", tone: "amber" });
  }
  if (r.reflectionTime && t >= r.reflectionTime && ctx.letterUnread) out.push({ id: "letter", text: "Your weekly letter is ready.", tone: "signal", action: { label: "Read it", href: "/app/coach" } });
  if (profile.lifeMode.mode !== "normal") {
    const m = profile.lifeMode.mode;
    const text = { travel: "Travel mode: sessions are bodyweight and band versions until you're back.", ill: "Illness mode: training is paused without touching your streak. Rest, fluids, protein.", injured: "Injury mode: movements that load the affected area are swapped out.", busy: "Busy mode: sessions trimmed to the main lifts, about 30 minutes.", newborn: "New parent mode: two short sessions a week, sleep first." }[m];
    out.push({ id: "mode", text: `${text}${profile.lifeMode.until ? ` Ends ${profile.lifeMode.until}.` : ""}`, tone: "amber", action: { label: "Change", href: "/app/settings#life" } });
  }
  return out;
}

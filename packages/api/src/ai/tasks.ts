import { z } from "zod";
import { TrainingProfile, Injury, type ProgrammePlan, type NutritionTargets, type WeeklyMealPlan, type BaselineMetrics, type Readiness } from "@kettleworth/types";
import { structured, aiAvailable } from "./client";
import { COACH_SYSTEM, INTAKE_SYSTEM, EXTRACT_SYSTEM } from "./prompts";

export { aiAvailable };

/** Models occasionally emit HTML entities or half-escaped dashes; normalise before display. */
export function cleanText(t: string): string {
  // Models sometimes double-escape: decode literal \uXXXX sequences first so the dash rules below can see them.
  t = t.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return t.replace(/(?<=\d)\s?(?:&ndash;|&#8211;|ndash;|dash;|\u2013|\u2014)\s?(?=\d)/g, " to ").replace(/\s?(?:&ndash;|&#8211;|&mdash;|&#8212;|\bndash;|\bmdash;|\bdash;|\u2013|\u2014)\s?/g, ", ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/,\s*,/g, ",").trim();
}

// ---------- Intake follow-up ----------
const FollowUp = z.object({ done: z.boolean(), question: z.string().nullable(), reason: z.string().nullable() });
export async function intakeFollowUp(userId: string, profile: Partial<TrainingProfile>, transcript: { role: string; text: string }[], stage: string): Promise<{ question: string; reason: string } | null> {
  const out = await structured({
    task: "intake_followup", userId, system: INTAKE_SYSTEM, schema: FollowUp, effort: "low", maxTokens: 400,
    user: `Stage just completed: ${stage}\n\nProfile so far:\n${JSON.stringify(profile, null, 1)}\n\nTranscript (last 12 turns):\n${transcript.slice(-12).map((t) => `${t.role}: ${t.text}`).join("\n")}`,
  });
  if (!out || out.done || !out.question) return null;
  return { question: out.question, reason: out.reason ?? "" };
}

// ---------- Free-text extraction ----------
const Extraction = z.object({
  injuries: z.array(Injury),
  medicalFlags: z.array(z.string()),
  dislikedFoods: z.array(z.string()),
  notes: z.string().nullable(),
  timelineWeeks: z.number().int().min(4).max(52).nullable(),
  sleepHours: z.number().min(3).max(12).nullable(),
  stressLevel: z.number().int().min(1).max(5).nullable(),
});
export type Extraction = z.infer<typeof Extraction>;
export async function extractFromAnswer(userId: string, question: string, answer: string): Promise<Extraction | null> {
  return structured({ task: "intake_extract", userId, system: EXTRACT_SYSTEM, schema: Extraction, effort: "low", maxTokens: 600, user: `Question asked: ${question}\nUser answer: ${answer}` });
}

// ---------- Profile summary ----------
const Summary = z.object({ summary: z.string().max(700), headline: z.string().max(80) });
export async function summariseProfile(userId: string, profile: TrainingProfile, baseline: BaselineMetrics): Promise<{ summary: string; headline: string }> {
  const out = await structured({ task: "profile_summary", userId, system: COACH_SYSTEM, schema: Summary, effort: "low", maxTokens: 600, user: `Write a 3-sentence training profile the user will review, plus a 6-word headline. Speak to them as "you".\n\nProfile:\n${JSON.stringify(profile, null, 1)}\n\nBaseline metrics:\n${JSON.stringify(baseline, null, 1)}` });
  return out ? { summary: cleanText(out.summary), headline: cleanText(out.headline) } : fallbackSummary(profile, baseline);
}
export function fallbackSummary(p: TrainingProfile, b: BaselineMetrics): { summary: string; headline: string } {
  const goal = p.primaryGoal.replace("_", " ");
  const env = p.environment === "home" ? "at home" : p.environment === "both" ? "at the gym and at home" : "at the gym";
  const s1 = `You're ${p.experience === "beginner" ? "starting out" : `an ${p.experience} lifter`} training ${p.daysPerWeek} days a week for about ${p.sessionMinutes} minutes ${env}, with ${goal} as the main goal over ${p.timelineWeeks} weeks.`;
  const s2 = p.injuries.length ? `We'll work around your ${p.injuries.map((i) => i.region.replace("_", " ")).join(" and ")} by excluding movements that load it and offering swaps.` : `No injuries to work around, so the full library is open to you.`;
  const s3 = b.targetCalories ? `Nutrition starts at ${b.targetCalories} kcal and ${b.proteinG} g protein on a ${p.dietType} diet, adjusted weekly from your weight trend.` : `Add your height, weight and age to unlock calorie and macro targets.`;
  return { summary: `${s1} ${s2} ${s3}`, headline: `${capital(goal)}, ${p.daysPerWeek} days, ${p.timelineWeeks} weeks` };
}

// ---------- Programme coach note ----------
const CoachNote = z.object({ note: z.string().max(900), weekOneFocus: z.string().max(200) });
export async function programmeCoachNote(userId: string, profile: TrainingProfile, plan: ProgrammePlan, exerciseNames: Record<string, string>): Promise<{ note: string; weekOneFocus: string }> {
  const w1 = plan.mesocycles[0]?.weeks[0];
  const outline = w1?.sessions.map((s) => `${s.name}: ${s.exercises.map((e) => exerciseNames[e.exerciseId] ?? e.exerciseId).join(", ")}`).join("\n");
  const out = await structured({ task: "programme_note", userId, system: COACH_SYSTEM, schema: CoachNote, effort: "medium", maxTokens: 900, validate: (o) => (/\b(deadlift|squat|bench|press|row|curl)\b/i.test(o.note) && !Object.values(exerciseNames).some((n) => o.note.toLowerCase().includes(n.toLowerCase().split(" ")[0]!)) ? ["mentions exercises not in the plan"] : []),
    user: `Write a short coach note (2 paragraphs, under 120 words total) introducing this programme to the user, and a one-line "week one focus". Reference their goal, schedule and one or two named exercises from the outline. Do not list every exercise.\n\nProfile:\n${JSON.stringify({ goal: profile.primaryGoal, experience: profile.experience, days: profile.daysPerWeek, minutes: profile.sessionMinutes, styles: profile.styles, injuries: profile.injuries }, null, 1)}\n\nProgramme: ${plan.name}\nRationale: ${plan.rationale.join(" ")}\nWeek 1 outline:\n${outline}` });
  if (out) return { note: cleanText(out.note), weekOneFocus: cleanText(out.weekOneFocus).replace(/^week one focus:\s*/i, "") };
  return { note: `${plan.summary} ${plan.rationale[0] ?? ""} Week one is about finding working weights you can move with good form: leave a couple of reps in reserve and log every set so the plan can progress you.`, weekOneFocus: "Find your working weights and log every set." };
}

// ---------- Meal plan note ----------
const MealNote = z.object({ note: z.string().max(500) });
export async function mealPlanNote(userId: string, profile: TrainingProfile, targets: NutritionTargets, plan: WeeklyMealPlan, recipeNames: Record<string, string>): Promise<string> {
  const out = await structured({ task: "meal_plan_note", userId, system: COACH_SYSTEM, schema: MealNote, effort: "low", maxTokens: 400, user: `Write a 3-sentence note introducing this week's meal plan: the calorie/protein targets, one practical prep tip, and a reminder they can swap meals. Recipes this week: ${[...new Set(plan.items.map((i) => recipeNames[i.recipeId] ?? i.recipeId))].join(", ")}. Targets: ${targets.calories} kcal, ${targets.proteinG} g protein. Diet: ${profile.dietType}. Cooking limit: ${profile.cookingMinutes} min.` });
  return out?.note ? cleanText(out.note) : `This week lands around ${targets.calories} kcal a day with ${targets.proteinG} g protein, using ${profile.dietType} recipes that take ${profile.cookingMinutes} minutes or less. Cook the batch recipes once and reuse them across two days. Swap any meal you don't fancy and the totals update.`;
}

// ---------- Daily readiness message ----------
export function readinessMessage(r: Readiness): string {
  return r.reasons.join(" ");
}
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Body photo analysis ----------
import { Muscle } from "@kettleworth/types";
const BodyRead = z.object({
  summary: z.string().max(1500),
  build: z.enum(["lean", "athletic", "average", "carrying_extra", "unclear"]),
  bodyFatLowPct: z.number().min(3).max(60).nullable(),
  bodyFatHighPct: z.number().min(3).max(60).nullable(),
  strengths: z.array(z.string().max(300)).max(4),
  focusAreas: z.array(z.object({ muscle: Muscle, reason: z.string().max(300) })).max(4),
  posture: z.array(z.string().max(300)).max(3),
  caveats: z.array(z.string().max(300)).max(3),
});
export type BodyRead = Omit<z.infer<typeof BodyRead>, "bodyFatLowPct" | "bodyFatHighPct"> & { bodyFatRangePct: [number, number] | null };
export async function analyseBodyPhotos(userId: string, images: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp"; pose: string }[], profile: TrainingProfile): Promise<BodyRead | null> {
  const out = await structured({
    task: "body_photo_analysis", userId, schema: BodyRead, effort: "medium", maxTokens: 1200, images: images.map(({ data, mediaType }) => ({ data, mediaType })),
    system: `${COACH_SYSTEM}

You are reading progress photos for a coaching client who asked for this. Be respectful, neutral and specific; never comment on attractiveness, never use words like fat, skinny, flabby or weak. Describe build in training terms. Give a body-fat range only if the photos genuinely support one (lighting, clothing and pose limit accuracy; say so in caveats). Focus areas are muscles that, developed, would best serve the client's stated goal and balance, chosen from the taxonomy provided. Posture notes are observations, not diagnoses. If the photos are unclear or not of a person's body, set build to unclear and explain. Summary: at most 70 words. Every list item: one sentence.`,
    user: `Client goal: ${profile.primaryGoal}. Experience: ${profile.experience}. Height ${profile.heightCm ?? "?"} cm, weight ${profile.weightKg ?? "?"} kg, self-estimated body fat ${profile.bodyFatPct ?? "not given"}%. Photo poses in order: ${images.map((i) => i.pose).join(", ")}. Muscle taxonomy: ${Muscle.options.join(", ")}.`,
    validate: (o) => (o.focusAreas.some((f) => !Muscle.options.includes(f.muscle)) ? ["unknown muscle"] : []),
  });
  if (!out) return null;
  const { bodyFatLowPct, bodyFatHighPct, ...rest } = out;
  return { ...rest, bodyFatRangePct: bodyFatLowPct != null && bodyFatHighPct != null ? [Math.min(bodyFatLowPct, bodyFatHighPct), Math.max(bodyFatLowPct, bodyFatHighPct)] : null, summary: cleanText(out.summary), strengths: out.strengths.map(cleanText), posture: out.posture.map(cleanText), caveats: out.caveats.map(cleanText), focusAreas: out.focusAreas.map((f) => ({ ...f, reason: cleanText(f.reason) })) };
}

// ---------- Food estimate (text or photo) ----------
const FoodItem = z.object({
  name: z.string().max(80),
  portion: z.string().max(80),
  grams: z.number().min(0).max(3000).nullable(),
  calories: z.number().min(0).max(3000),
  proteinG: z.number().min(0).max(300),
  carbsG: z.number().min(0).max(400),
  fatG: z.number().min(0).max(300),
  fibreG: z.number().min(0).max(100),
  confidence: z.enum(["high", "medium", "low"]),
});
const MealEstimate = z.object({ recognised: z.boolean(), portionsVisible: z.number().int().min(1).max(24), items: z.array(FoodItem).max(12), note: z.string().max(300).nullable() });
export type FoodEstimateItem = z.infer<typeof FoodItem>;

const FOOD_SYSTEM = `You estimate the nutrition of food and drink for someone logging their day. You work like a registered dietitian reading a plate: identify each distinct item, judge the portion from what is visible or described, and apply standard reference values (McCance and Widdowson, USDA FoodData Central).
Rules:
- Itemise. A plate of chicken, rice and broccoli is three items; a latte is one item.
- One person, one portion. If the photo shows several identical portions (meal prep boxes, a tray of servings, a shared platter), give the items and values for ONE portion only and set portionsVisible to how many there are. Otherwise portionsVisible is 1.
- Portions: use the plate, bowl, cutlery and hand sizes in a photo as scale. For text, take stated quantities literally and otherwise assume a typical single serving.
- Include what is easy to forget when it is visible or implied: cooking oil, butter, dressings, sauces, milk and sugar in drinks.
- Calories must agree with the macros (protein 4, carbohydrate 4, fat 9 kcal per gram, alcohol 7).
- Confidence is high only when the item and portion are both clear; low when the portion is a guess.
- If the photo or text is not food or drink, set recognised to false and return no items.
- The note is one short sentence on the biggest source of uncertainty, or null. Never moralise about the food.
- British English. Never use em dashes or en dashes.`;

/** Itemised calories and macros from a description or a photo. Calories are reconciled to the macros when they disagree. */
export async function estimateMeal(userId: string, input: { text?: string; image?: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" } }): Promise<z.infer<typeof MealEstimate> | null> {
  const out = await structured({
    task: input.image ? "food_photo_estimate" : "food_text_estimate", userId, system: FOOD_SYSTEM, schema: MealEstimate, effort: "low", maxTokens: 1400,
    images: input.image ? [input.image] : undefined,
    user: input.image ? `Estimate everything on this photo.${input.text ? ` The person added: ${input.text}` : ""}` : `What they had: ${input.text}`,
  });
  if (!out) return null;
  return {
    ...out,
    note: out.note ? cleanText(out.note) : null,
    items: out.items.map((i) => {
      const fromMacros = i.proteinG * 4 + i.carbsG * 4 + i.fatG * 9;
      const alcohol = /\b(beer|lager|wine|cider|gin|vodka|rum|whisk|spirit|cocktail|prosecco|champagne)\b/i.test(i.name);
      const off = fromMacros > 0 && Math.abs(i.calories - fromMacros) / Math.max(i.calories, fromMacros) > 0.25;
      return { ...i, name: cleanText(i.name), portion: cleanText(i.portion), calories: Math.round(off && !alcohol ? fromMacros : i.calories), proteinG: Math.round(i.proteinG * 10) / 10, carbsG: Math.round(i.carbsG * 10) / 10, fatG: Math.round(i.fatG * 10) / 10, fibreG: Math.round(i.fibreG * 10) / 10 };
    }),
  };
}

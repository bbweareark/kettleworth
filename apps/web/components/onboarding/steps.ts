import type { TrainingProfile } from "@kettleworth/types";

export type StepId = "basics" | "body" | "experience" | "goals" | "schedule" | "environment" | "styles" | "injuries" | "lifestyle" | "diet" | "food" | "lifts" | "review";
export const STEPS: { id: StepId; coach: (p: Partial<TrainingProfile>, name: string) => string }[] = [
  { id: "basics", coach: (_p, n) => `Hi ${n}, I'm your Kettleworth coach. I'll ask a few quick questions so the plan is actually yours. First, the basics: how old are you, and which units do you think in?` },
  { id: "body", coach: () => "Height and weight next. A body-fat estimate helps too, but a rough guess is fine, and you can skip it." },
  { id: "experience", coach: () => "How would you describe your training experience? Be honest, this sets the starting intensity." },
  { id: "goals", coach: () => "What are you training for? Pick everything that applies, then tell me which matters most and how long you want to give it." },
  { id: "schedule", coach: (p) => `${p.primaryGoal === "fat_loss" ? "Consistency beats intensity for fat loss. " : ""}How many days a week can you realistically train, and for how long?` },
  { id: "environment", coach: () => "Where will you train, and what kit do you have access to? I'll never program equipment you don't have." },
  { id: "styles", coach: () => "What kind of training do you enjoy? And any exercises you love or absolutely hate? Hated ones are excluded for good." },
  { id: "injuries", coach: () => "Anything I should work around: injuries, pain, or medical conditions? This shapes exercise selection and I'll flag anything you should check with a professional." },
  { id: "lifestyle", coach: () => "Roughly how much sleep do you get, and how stressed are you day to day? Both change how hard we push." },
  { id: "diet", coach: () => "Nutrition. How do you eat, and are there allergies or foods you avoid?" },
  { id: "food", coach: () => "Last bits for the meal plan: foods you dislike, how long you'll spend cooking, and your grocery budget." },
  { id: "lifts", coach: (p) => (p.experience === "beginner" ? "If you've never lifted, skip this. Otherwise, tell me a recent set on any big lift so I can set starting weights." : "Tell me a recent set on the big lifts (any weight for any reps) and I'll estimate your maxes to set starting loads.") },
  { id: "review", coach: () => "Here's your training profile and baseline numbers. Edit anything, then I'll build the programme." },
];

/** The journey around each question: a chapter, a statement, and the ground image (gendered where an athlete is shown). */
export type Chapter = "You" | "Intent" | "Arena" | "Body" | "Fuel" | "Numbers" | "Ready";
export const JOURNEY: Record<StepId, { chapter: Chapter; headline: string; sub: string; art: string | { male: string; female: string } }> = {
  basics: { chapter: "You", headline: "Every plan starts with who you are.", sub: "Two minutes of honest answers. The engine does the rest.", art: "dawn" },
  body: { chapter: "You", headline: "Numbers, not judgement.", sub: "Height, weight and a rough shape set your calorie floor and your first loads.", art: "chalk" },
  experience: { chapter: "You", headline: "Where you are is the starting line.", sub: "Experience sets the intensity you begin at, not the ceiling.", art: "hands" },
  goals: { chapter: "Intent", headline: "Name it, and we build towards it.", sub: "One goal leads. The rest shape the accessories.", art: { male: "goals-m", female: "goals-f" } },
  schedule: { chapter: "Intent", headline: "Consistency is the whole game.", sub: "A plan you can keep beats a plan you admire.", art: "clock" },
  environment: { chapter: "Arena", headline: "We build with what you have.", sub: "Nothing gets programmed that you cannot actually lift.", art: "garage" },
  styles: { chapter: "Arena", headline: "Training you enjoy is training you do.", sub: "Loved exercises get priority. Hated ones never appear.", art: { male: "styles-m", female: "styles-f" } },
  injuries: { chapter: "Body", headline: "We work around it, never through it.", sub: "Every exercise is checked against what hurts.", art: "knee" },
  lifestyle: { chapter: "Body", headline: "Recovery is where you grow.", sub: "Sleep and stress decide how hard each week can push.", art: "bedroom" },
  diet: { chapter: "Fuel", headline: "Fuel the work.", sub: "Targets from your body and your training days, not a generic diet.", art: "prep" },
  food: { chapter: "Fuel", headline: "Real food. Your kitchen. Your budget.", sub: "Meals you would actually cook, at a cost you would actually pay.", art: "knife" },
  lifts: { chapter: "Numbers", headline: "Give me a number and I set the bar.", sub: "One recent set per lift is enough to calibrate week one.", art: "plates" },
  review: { chapter: "Ready", headline: "This is your starting line.", sub: "Read it back. Then we build.", art: { male: "ready-m", female: "ready-f" } },
};
export const CHAPTERS: Chapter[] = ["You", "Intent", "Arena", "Body", "Fuel", "Numbers", "Ready"];
export function journeyArt(id: StepId, sex: "male" | "female" | "other" | undefined): string {
  const a = JOURNEY[id].art;
  return `/art/journey/${typeof a === "string" ? a : sex === "female" ? a.female : a.male}.jpg`;
}

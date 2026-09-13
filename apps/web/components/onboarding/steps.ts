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

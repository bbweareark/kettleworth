import { pgTable, text, timestamp, jsonb, real, uuid, integer, index, date } from "drizzle-orm/pg-core";
import { user } from "./auth";
import type { NutritionTargets, WeeklyMealPlan, RecipeMacros, MealSlot, DietType, Allergen } from "@kettleworth/types";

export const recipe = pgTable("recipe", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  slots: jsonb("slots").$type<MealSlot[]>().notNull(),
  dietTypes: jsonb("diet_types").$type<DietType[]>().notNull(),
  allergens: jsonb("allergens").$type<Allergen[]>().notNull().default([]),
  prepMinutes: integer("prep_minutes").notNull(),
  costTier: text("cost_tier").$type<"low" | "medium" | "high">().notNull(),
  servings: integer("servings").notNull().default(1),
  macros: jsonb("macros").$type<RecipeMacros>().notNull(),
  ingredients: jsonb("ingredients").$type<{ name: string; quantity: number; unit: string; aisle: string; costPerUnit: number }[]>().notNull(),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const nutritionPlan = pgTable("nutrition_plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  targets: jsonb("targets").$type<NutritionTargets>().notNull(),
  status: text("status").$type<"active" | "superseded">().notNull().default("active"),
  reason: text("reason").notNull().default("initial"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("nutrition_plan_user_idx").on(t.userId, t.status)]);

export const mealPlan = pgTable("meal_plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  weekStartsOn: date("week_starts_on").notNull(),
  plan: jsonb("plan").$type<WeeklyMealPlan>().notNull(),
  coachNote: text("coach_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("meal_plan_user_week_idx").on(t.userId, t.weekStartsOn)]);

export const foodLog = pgTable("food_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  loggedOn: date("logged_on").notNull(),
  slot: text("slot").$type<MealSlot>().notNull(),
  label: text("label").notNull(),
  recipeId: text("recipe_id"),
  servings: real("servings").notNull().default(1),
  macros: jsonb("macros").$type<RecipeMacros>().notNull(),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("food_log_user_date_idx").on(t.userId, t.loggedOn)]);

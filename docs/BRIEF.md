# Kettleworth, Architecture & Design Brief

_Last updated: 13 Sep 2026. Status: Phase 1 in progress._

## 0. Decisions taken

| Question | Decision |
|---|---|
| Name | **Kettleworth**. `kettleworth.com` and `kettleworth.app` unregistered (RDAP-verified 13 Sep 2026). No conflicting fitness brand found. Reads as heritage strength brand, not "AI". |
| Market | Global from day one. Metric **and** imperial (per-user unit preference, stored canonical metric). en copy, GBP/USD/EUR aware cost estimates. GDPR-grade privacy for everyone. |
| Monetisation | Free for now. `subscription` table + `entitlements()` helper shipped so gating is one line later. Stripe wiring is Phase 1.5. |
| Budget | Free tiers, local-first. Postgres + Redis in Docker. Claude API pay-as-you-go. Mux free tier with clearly labelled placeholders until real footage. PostHog/Sentry free tiers, optional via env. |

## 1. Product thesis
Kettleworth is a coach, not a tracker. Every screen answers "what should I do today and why". Three loops:

1. **Understand**, conversational intake builds a *Training Profile* (body, goals, constraints, preferences). The user owns and edits it.
2. **Prescribe**, a deterministic programme engine builds a periodised plan from the profile. Claude proposes narrative and tie-break choices; rules validate. Nothing reaches the user that fails the constraints (equipment, injuries, dislikes, calorie floors).
3. **Adapt**, every logged set, missed session, sleep score and weigh-in feeds the weekly adaptation. Every change carries a one-sentence explanation.

Community (Phase 2) exists to make loop 3 stick.

## 2. Monorepo layout

```
kettleworth/
  apps/web                 Next.js 16 (App Router, Turbopack), PWA, route handlers = API
  packages/types           Zod schemas + TS types shared by web, api, core, mobile
  packages/core            Pure domain logic. No IO. metrics, programme engine, progression,
                           nutrition, readiness. 100% unit-tested (Vitest).
  packages/db              Drizzle schema, migrations, seed (exercise library, recipes)
  packages/api             Server services: auth config, AI coach (Claude), programme/nutrition
                           orchestration, integrations sync, entitlements. Framework-agnostic;
                           Next route handlers are thin wrappers so Expo/mobile can reuse.
  packages/integrations    Provider-agnostic health data model + adapters (Oura, Whoop, Strava,
                           Fitbit, Garmin, Polar; HealthKit/Health Connect stubs for mobile)
  packages/ui              Design system: tokens (CSS vars + Tailwind v4 @theme), primitives
                           (Radix), components, motion presets. React DOM only; tokens are
                           exported as JSON for React Native.
  packages/config          Shared tsconfig / eslint
  apps/mobile              (Phase 3, Expo), slot reserved
```

Dependency direction: `types` ← `core` ← `api` ← `web`. `ui` depends only on `types`. `integrations` depends on `types` + `core`.

## 3. Stack

- **Web**: Next.js 16, React 19, TypeScript 5.9, Tailwind v4 (CSS-first tokens), Radix primitives, `motion` (Framer Motion v13), Recharts, Serwist PWA.
- **Data**: Postgres 16 (Docker locally → Neon/Supabase in prod), Drizzle ORM + `postgres.js`. Redis 7 for job queue and cache (BullMQ).
- **Auth**: better-auth (email+password, magic link, Google, Apple). Drizzle adapter. Cookie sessions, CSRF-safe, `httpOnly` + `SameSite=Lax`.
- **AI**: `@anthropic-ai/sdk`, model `claude-opus-5` (adaptive thinking, `effort` tuned per task), structured outputs via `messages.parse` + `zodOutputFormat`. Every prompt + output logged to `ai_log` for eval. Model may only reference exercise IDs and recipe IDs that exist; validators reject otherwise. No key → deterministic coach path (scripted intake, rules-only programme, templated explanations) so the product works end-to-end without AI.
- **Video**: Mux (`@mux/mux-player-react`). `exercise_video` rows carry `provider`, `playbackId`, `status`, `license`, `isPlaceholder`. Until real footage exists the library shows still images from a public-domain dataset (free-exercise-db, Unlicense) with a visible "Demo footage coming" label.
- **Payments**: Stripe (Phase 1.5). `subscription` table now.
- **Observability**: PostHog + Sentry, env-gated.
- **Tests**: Vitest (`core`, `api`), Playwright (web flows), CI = GitHub Actions on push.

## 4. Data model (Phase 1 + reserved)
Auth: `user`, `session`, `account`, `verification` (better-auth).
Profile: `profile` (units, DOB, sex, height, experience, goals[], timeline, schedule, environment, equipment[], likes[], dislikes[], styles[], injuries[], medicalFlags[], sleep, stress, dietType, allergies[], dislikedFoods[], cookingMinutes, budgetTier, notes, aiSummary), `body_measurement` (weight, bodyFat, waist, ... time series), `progress_photo`, `estimated_max` (per exercise, source).
Training: `programme` → `mesocycle` → `week` → `session` → `exercise_instance` (planned sets JSON + `set_log` rows). `substitution`, `session_feedback` (soreness, fatigue, RPE), `adaptation` (what changed + why).
Library: `exercise`, `exercise_alias`, `exercise_video`, `muscle`.
Nutrition: `nutrition_plan` (targets + reasoning), `meal_plan` → `meal_plan_item`, `recipe`, `recipe_ingredient`, `food_log`.
Integrations: `connected_provider`, `health_sample` (normalised, + `raw` JSON, `source`, `confidence`), `provider_priority`.
Community (Phase 2): `community_profile`, `group`, `group_member`, `post`, `comment`, `reaction`, `match`, `message`, `challenge`, `challenge_entry`, `report`, `block`.
Billing: `subscription`. Meta: `ai_log`, `audit_log`.

Sensitive columns (health notes, OAuth tokens, medical flags) are encrypted at rest with AES-256-GCM using `HEALTH_DATA_ENCRYPTION_KEY`. GDPR: `/api/account/export` (JSON zip) and `/api/account/delete` (hard delete with cascade + provider disconnect).

## 5. Programme engine (core)
- Inputs: profile + library. Output: `Programme` (8–12 weeks, 2–3 mesocycles, deload weeks).
- Split selection by days/week and goal: 2d full-body, 3d full-body or PPL-lite, 4d upper/lower, 5d PPL+UL, 6d PPL.
- Exercise selection: score candidates by (pattern coverage, equipment fit, liked +, disliked = excluded, injury contraindication = excluded, experience-appropriate difficulty, style preference). Deterministic with seeded tie-breaks so regeneration is stable.
- Prescription by goal: strength 3–6 reps @ RPE 7–9, hypertrophy 6–15 @ RIR 1–3, endurance 12–20, general 8–12. Volume landmarks per muscle/week (MEV→MAV ramp across mesocycle, deload at ~50% volume).
- Progression: double progression for hypertrophy, linear/RPE-based for strength. Adaptation rules in `core/adaptation.ts` (Phase 2 wiring, rules written now).
- Every decision emits a `Rationale` string so the UI can show "why".

## 6. Nutrition engine (core)
- TDEE: Mifflin-St Jeor × activity multiplier, refined by measured activity when wearable data exists. Goal delta: fat loss −15–20% (floor 1200 kcal F / 1500 kcal M and ≥ BMR × 1.05), muscle +10%, recomp 0.
- Macros: protein 1.6–2.2 g/kg, fat ≥ 0.7 g/kg, carbs remainder; peri-workout carb bias.
- Meal plan: pick recipes matching diet type, excluding allergens and disliked foods, within cooking minutes and budget tier; scale portions to hit targets ±5%; grocery list aggregated by ingredient.
- Safety: refuses < floors, flags medical conditions, disclaimer on every nutrition surface.

## 7. Design system
**Aesthetic**: confident, minimal, high-contrast, calm data. Dark default ("Iron" theme), light theme ("Chalk").

- **Colour**: neutrals on OKLCH greys (`bg`, `surface`, `surface-2`, `border`, `fg`, `fg-muted`). Accent **Ember** (warm orange, `oklch(72% 0.19 45)`) for primary actions and PRs. **Signal** green for success/readiness-high, **Amber** for caution, **Rose** for danger/readiness-low. Data series palette of 6 hue-spaced tokens.
- **Type**: Inter Tight for display (tight tracking, 600/700), Inter for body, JetBrains Mono for numerics in the session player (tabular figures). Scale 12/14/16/18/22/28/36/48/64.
- **Spacing** 4-pt grid. **Radius** 6/10/14/20/full. **Elevation** via borders + subtle inner glow, not big shadows.
- **Motion**: 150 ms micro, 250 ms panel, spring for celebrations. `prefers-reduced-motion` disables non-essential motion globally.
- **Components**: Button, IconButton, Input, Select, Slider, Segmented, Chip, Card, Sheet, Dialog, Toast, Tabs, Progress, Ring, Stat, Skeleton, EmptyState, Timer, RestCountdown, SetRow, ExerciseCard, MuscleBadge, PRCelebration.
- **Accessibility**: WCAG 2.2 AA contrast checked per token pair; full keyboard nav; focus rings visible; live regions for timers.

## 8. Phase plan
**Phase 1 (web MVP)**, in this order, each verified running:
1. Design system + landing page
2. Auth (email/password, magic link, Google/Apple when configured)
3. Onboarding intake (conversational) → Training Profile + baseline metrics
4. Exercise library (import + search + detail + video slot)
5. Programme generation (engine + AI narrative) + programme overview
6. Session player with set logging, timers, swaps, offline queue
7. Progress: strength trends, volume, e1RM, measurements, streaks
8. Nutrition targets + weekly meal plan + grocery list
9. Connected Apps page + integrations package (OAuth flows for cloud providers)
10. Settings, privacy (export/delete), PWA, CI

**Phase 2**: adaptive weekly engine (job), food logging, community.
**Phase 3**: Expo app, HealthKit/Health Connect, photo food estimation, form check.

## 9. Video sourcing plan
1. Launch: free-exercise-db stills (Unlicense) + "Demo footage coming" label.
2. Weeks 1–6: produce 150 core-lift clips in-house (one studio day ≈ 40 clips; 4 days), 2 angles, 6–10 s loops, upload to Mux via `scripts/upload-videos.ts`, which sets `isPlaceholder=false`.
3. Long tail: licence from a stock exercise video library (e.g. ExerciseDB Pro / Vecteezy commercial) for remaining movements; track licence per row.

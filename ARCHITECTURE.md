# Architecture: Kettleworth

Mode: Review
Written: 2026-10-25   Last updated: 2026-10-25
Skill: stack-architect

Review mode: no source files were changed, nothing was installed or run. The owner was not
available, so every assumption is recorded inline and marked as such. Evidence is cited as
file paths relative to the project root.

## 1. Product

Kettleworth is an AI fitness coach delivered as a web PWA (`apps/web`, Next.js 16 App Router
with route handlers as the API; mobile is a reserved Phase 3 slot). A conversational intake
builds a Training Profile; a deterministic programme engine (`packages/core`, 16 Vitest
files) builds periodised strength programmes and nutrition targets from it; Claude adds
narrative, follow-up questions, a weekly "Sunday letter", a coach chat, body-photo reads and
meal-photo estimates (`packages/api/src/ai/tasks.ts`, `packages/api/src/services/coach.ts`).
Every logged set, wearable sample (Oura, Whoop, Strava, Fitbit, Garmin, Polar via
`packages/integrations`) and weigh-in feeds a weekly adaptation. Data shape: relational, per
user: one profile row with a JSONB profile, programme -> mesocycle -> week -> training_session
-> exercise_instance (planned and logged sets as JSONB), body measurements, progress photos
(blobs, up to 8 MB each, currently stored as `bytea` in Postgres on Vercel), health_sample
time series with an encrypted raw payload per row, an `ai_log` row with full prompt and output
per AI call, and community tables (posts, groups, messages). Read-heavy on the session player
and progress pages, write-heavy during a workout (one POST per logged set, queued offline in
IndexedDB and replayed). Batch: a Monday 06:00 cron generates and emails every user's letter.
Integrations: Anthropic API, Resend email, Mux video, YouTube Data API (seed scripts), six
wearable OAuth providers. Compliance: health data and OAuth tokens are AES-256-GCM encrypted
at the field level (`packages/db/src/crypto.ts`), GDPR export and hard delete exist
(`apps/web/app/api/account/*`), users are global (`docs/BRIEF.md`). Revenue: none set.
`docs/BRIEF.md` says "Free for now", a `subscription` table and `entitlements()` exist but
`BILLING_ENFORCED` is unset so every feature, including every AI feature, is free to every
user. Assumption for gate 3: the monetize cheap-side default of £3 per paying user per month
at 3% of MAU.

## 2. Who uses it and the load model (gate 1: design for 1,000,000)

Stated audience: not stated by the owner; `docs/BRIEF.md` says "Global from day one".
Design point: 1,000,000 registered users. Ratios: MAU 40% (default), DAU 20% (daily-use
tool, churny fitness category: between the 15% default and the 25% daily-tool figure),
80 requests per DAU per day (one POST per logged set plus page data), peak factor 3 (gym
peaks 06:00-08:00 and 17:00-19:00). Wearable adoption assumed 10% of users.

| Quantity | Ratio / assumption | Value at 1M |
|---|---|---|
| MAU | 40% of registered | 400,000 |
| DAU | 20% of registered | 200,000 |
| Peak RPS | 200k x 80 / 86,400 = 185 avg, x3 | ~555 RPS |
| DB rows (largest table) | `exercise_instance`: 400k MAU x 4 sessions/wk x 6 = 9.6M rows/wk | ~500M rows/year (`health_sample` ~365M/yr at 10% wearable adoption x 10 samples/day; `ai_log` as found ~5M rows/month) |
| DB size incl. indexes | 500M x ~600 B x 1.5 + health_sample 365M x ~500 B x 1.5 + ai_log ~10 KB/row | ~1.3 TB/year without ai_log retention; ai_log alone ~600 GB/year as found |
| Blob storage | 6 MB per registered user average (photos up to 8 MB, most users never upload) | ~5.9 TB, currently `bytea` in Postgres on Vercel |
| Egress per month | 5 MB per DAU per day (JSON, service-worker cached assets, thumbnails) | ~29 TB/month |
| Async jobs per day | weekly letters 1M/week as found (400k/week target) + ~100k wearable syncs | ~250,000/day |

How each component meets the number:

- Next.js route handlers are stateless (session read from Postgres via better-auth cookie,
  `apps/web/lib/session.ts`; no module-level state found by grep beyond a `Set` of MIME
  types), so 555 RPS peak is 2-4 instances or Vercel's autoscaling: meets it.
- Postgres 16 over `postgres.js` with `max: 10, prepare: false`
  (`packages/db/src/index.ts`) and Neon's pooled connection string (`docs/DEPLOY.md`): meets
  it at 8 vCPU with a replica, but `health_sample` and `exercise_instance` need monthly
  partitioning and `ai_log` needs a retention policy before the second year. Indexes exist on
  every hot path (`packages/db/src/schema/*.ts`).
- Progress photos: `packages/api/src/services/photos.ts` writes bytes into the
  `progress_photo.data` bytea column when `PHOTO_STORAGE=db` or `process.env.VERCEL` is set.
  5.9 TB of blobs inside Postgres does not meet the number (dump, replica and storage cost);
  the file's own comment says "swap for S3/R2 by replacing these three functions".
- Weekly cron: `apps/web/app/api/cron/weekly/route.ts` selects every profile and loops
  sequentially, one AI call plus one email per user, inside a single serverless invocation.
  At a few thousand users this exceeds any function timeout; at 1M it is days of work with
  no cursor, no batching and no retry. Does not meet the number.
- better-auth rate limiting (`rateLimit: { enabled: true, window: 60, max: 30 }` in
  `packages/api/src/auth.ts`) uses the library default `storage: "memory"` (no
  `secondaryStorage` configured), so on Vercel each instance keeps its own counter and the
  limit is ineffective; harmless to correctness, useless at scale.
- Wearable sync (`syncProvider` in `packages/api/src/services/integrations.ts`) runs inline
  in the request that triggers it and writes a `sync_job` row for status; no worker consumes
  the table. Fine at 1M because it is user-triggered, but the weekly cron cannot fan it out.
- Redis is declared in `docker-compose.yml` and `.env.example` but no code imports a Redis
  client (grep for `ioredis`, `redis`, `bullmq` returns nothing); `docs/DEPLOY.md` says "Redis
  is not required". Sessions are in Postgres, so this is an unused service, not a gap.
- Offline set logging (`apps/web/lib/offline-queue.ts`) replays idempotently (set-number
  upsert), so burst replays after a gym's Wi-Fi returns are safe.

Gate 1: WARN - Postgres primary store, stateless handlers and sessions in the database
scale horizontally (`packages/db/src/index.ts`, `packages/api/src/auth.ts`); the three things
that do not are fixable in place: photo blobs in Postgres (`packages/api/src/services/photos.ts`),
the single-invocation sequential weekly cron (`apps/web/app/api/cron/weekly/route.ts`) and the
unbounded `ai_log` table (`packages/db/src/schema/meta.ts`).

## 3. Language (gate 2: Java, TypeScript or JavaScript)

Choice: TypeScript on Node 22 (`"engines": { "node": ">=22" }` in `package.json`,
`node-version: 22` in `.github/workflows/ci.yml`). Why: a web PWA that shares Zod schemas
between browser, API and domain engine (`packages/types` -> `core` -> `api` -> `web`), and the
owner's stated plan for an Expo client reusing `packages/api`. Every workspace package is
`.ts`/`.tsx`; seed and video scripts are TypeScript run with `tsx`
(`packages/db/package.json`); SQL lives in Drizzle migrations (`packages/db/drizzle/*.sql`).
No Python, Go, Swift or Kotlin anywhere in the tree. Waivers: none.

Gate 2: PASS - 100% TypeScript across `apps/web` and `packages/*`; the only non-TS files are
SQL migrations, CSS and YAML config.

## 4. Stack

Current picks as found, with the target where it differs (target changes are confined to
the three IMPROVE items; everything else stays).

| Layer | Pick | GA since | Why this, for this product |
|---|---|---|---|
| Runtime | Node 22 LTS, pnpm 12 workspaces, Turborepo 2 | Node 22 LTS 2024-10 | Shares types between browser and server; Expo reuse planned |
| Backend framework | Next.js 16 route handlers wrapping framework-agnostic services in `packages/api` | Next 1.0 2016-10 (GREEN) | API is thin; services are plain functions over Drizzle, so a mobile client or a separate Express service can reuse them without the framework |
| Frontend | React 19, Tailwind v4, Radix, `motion`, Recharts, Serwist PWA | React 2016 (GREEN); Tailwind 4 2025-01 (young, view layer only) | Offline session player with IndexedDB queue is the product's core loop; view layer is owned by `sensational-ui` |
| Database | PostgreSQL 16 (Docker locally, Neon in prod) | Postgres 16 2023-09; Neon is plain Postgres | Relational data with JSONB plan columns; one database for everything incl. community |
| Migrations / data access | Drizzle ORM 0.45 + drizzle-kit 0.31, 9 SQL migrations in repo (`packages/db/drizzle/`) | 2021-09 (AMBER: never 1.0, 61 months) | Schema in code and SQL in the repo; `postgres.js` driver underneath, swappable |
| Cache / sessions | Sessions in Postgres (better-auth tables); 5-minute cookie cache. Target: Redis/Valkey for rate-limit counters and per-user AI caps only | Redis 2009 | Sessions already stateless; Redis is declared in compose but unused today |
| Queue / jobs | None. Vercel Cron hits `/api/cron/weekly` which loops all users in one call. Target: a `job` table with a cursor, worked in batches by the same cron (or a container worker), `sync_job` table already exists as the pattern | n/a | Weekly letters and adaptation are the only real async work; a Postgres-backed batch loop is enough at 1M (250k jobs/day) |
| Object storage | None as found: photos are `bytea` in Postgres on Vercel, local disk in dev. Target: S3-compatible bucket (R2) behind the existing three functions in `photos.ts` | S3 API 2006; R2 2022-09 | 5.9 TB of photos at 1M belongs in object storage, not in the row store or the dump |
| Search | Postgres `ILIKE`/full-text over 855 seeded exercises and 46 recipes (`packages/api/src/services/library.ts`) | Postgres FTS 2008 | The catalogue is small and static; no search engine |
| Auth | better-auth 1.7 self-hosted: email+password (scrypt hashes), magic link via Resend, optional Google/Apple OAuth; users, sessions, accounts in own Postgres tables (`packages/db/src/schema/auth.ts`) | 1.0 2024-11 (AMBER, 23 months; 0.x since 2024-04) | £0 per MAU, hashes exportable; the young-library risk is contained because the tables are plain Postgres |
| Email | Resend behind `sendEmail()` (`packages/api/src/email.ts`); logs to console without a key | 2023-08 (AMBER) | Single adapter; swap is one file |
| Payments | Not wired. `subscription` table with Stripe ids (`packages/db/src/schema/billing.ts`) and `entitlements()` gate exist; `BILLING_ENFORCED` unset | Stripe 2011 | Phase 1.5 per `docs/BRIEF.md`; `monetize` owns pricing |
| AI | `@anthropic-ai/sdk` 0.125 behind one `structured()` wrapper (`packages/api/src/ai/client.ts`); `AI_MODEL` default `claude-opus-5`; every call returns `null` on failure and the product falls back to the deterministic engine. Target: per-task model tier and per-user entitlement + cap inside the same wrapper | SDK 0.x since 2023-01, 1.0 2026-10-21 (AMBER) | The fallback path is the product's strongest architectural property: AI is optional per call, so it can be gated per user without a rewrite |
| Video | Mux player + webhook (`apps/web/app/api/webhooks/mux/route.ts`) for owned footage; YouTube embeds from an allowlist for the library | Mux 2016 | Owned footage does not exist yet (open item); YouTube embeds cost nothing |
| Wearables | Six OAuth adapters behind a registry (`packages/integrations/src/registry.ts`), tokens encrypted in `connected_provider.credentials` | OAuth 2 2012 | Provider-agnostic sample model; HealthKit/Health Connect stubs for mobile |
| Hosting / deploy | Vercel (Hobby today, `apps/web/vercel.json`: region lhr1, one cron) + Neon Free; deploy is `vercel --prod` from `apps/web` (`docs/DEPLOY.md`). No Dockerfile for the app; `docker-compose.yml` runs only Postgres and Redis | Vercel 2015, Neon 2022 | Right for a free-tier MVP; the egress line is what would move it to a container behind Cloudflare at scale |
| Infra as code | None beyond `vercel.json`, `docker-compose.yml`, `.env.example` and `docs/DEPLOY.md` (a runbook) | n/a | Acceptable for one app on two managed services; the runbook is the exit document |
| Observability | `NEXT_PUBLIC_POSTHOG_*` and `SENTRY_DSN` env vars exist but no SDK is imported anywhere (grep); `ai_log` and `audit_log` tables in Postgres | n/a | Needs wiring before 100k; priced as hosted free tiers then usage |

Stack-age check (`scripts/stack-age.mjs`, run 2026-10-25): root manifest 0 RED / 0 AMBER /
1 GREEN; `apps/web/package.json` 0 RED, 11 AMBER, 9 GREEN, 6 unknown (workspace packages);
`packages/api/package.json` 0 RED, 5 AMBER, 2 GREEN; `packages/db/package.json` 0 RED,
2 AMBER, 4 GREEN. No RED anywhere. AMBER lines, each with the reason it is accepted:
`@anthropic-ai/sdk` (1.0 four days ago, 0.x since 2023; single adapter file), `better-auth`
(1.0 for 23 months, 0.x since 2024-04; state is in own Postgres tables), `drizzle-orm` and
`drizzle-kit` (never 1.0 but 61 months of releases; migrations are plain SQL in the repo),
`@mux/mux-player-react`, `@serwist/next`, `sonner`, `tailwind-merge`, `resend`, `vitest`
(each 35-58 months, none in the data layer), `@zxing/*` and `class-variance-authority`
(never 1.0, UI-only), `lucide-react` (1.0 seven months ago, icons). Every range is a caret
range (`^`), but `pnpm-lock.yaml` is committed and pins `next@16.3.5`, `react@19.3.0`,
`better-auth@1.7.4`, `drizzle-orm@0.45.2`, `postgres@3.4.9`, `zod@4.6.2` (forced via
`pnpm-workspace.yaml` overrides), and CI installs with `--frozen-lockfile`. No release
candidate, beta, canary or edge runtime is used; `next.config.ts` builds with webpack
(`next build --webpack`) while also declaring an empty `turbopack: {}` block, a mixed signal
but not a prerelease. `AI_MODEL` defaults to `claude-opus-5`; the model id is config, not a
dependency, and the fallback path covers its absence.

Gate 4 (boring): WARN - zero RED, all load-bearing pieces (Node 22 LTS, Postgres 16, Next.js
16, React 19, `postgres.js`) are GREEN; WARN for caret ranges across every manifest (mitigated
by the committed lockfile and `--frozen-lockfile` in `.github/workflows/ci.yml`) and for
`better-auth` carrying the auth layer at 23 months since 1.0.

## 5. Cost at scale (gate 3)

Priced on: 2026-10-25, reference ranges (unverified). Revenue compared against: £3 per paying
user per month, conversion 3% of MAU, the monetize cheap-side default, because no price is
set (`docs/BRIEF.md`: "Free for now"). No web lookups were made: provider lines use the
order-of-magnitude ranges in `references/cost-model.md` converted to GBP at roughly 0.8 per
USD. The LLM and Mux lines have no reference range and are stated assumptions (Opus-class
£12 per million input tokens and £60 per million output; Mux £0.001 per minute streamed);
they are the first numbers to verify, and they decide the gate.

As found (`architecture/cost-model.json`):

### Cost model: kettleworth (as found, 2026-10-25) (priced 2026-10-25, reference ranges (unverified), per month)

| Component | Provider | 1,000 users | 100,000 users | 1,000,000 users |
|---|---|---:|---:|---:|
| Web + API compute | Vercel (Next.js 16 serverless, region lhr1; apps/web/vercel.json, docs/DEPLOY.md) | £0 | £350.00 | £2,800 |
| PostgreSQL | Neon (docs/DEPLOY.md; plain Postgres 16 over postgres.js, packages/db/src/index.ts) | £0 | £60.00 | £1,400 |
| Progress photos stored as bytea in Postgres (!) uncapped per-unit line | Neon storage (PHOTO_STORAGE=db, packages/api/src/services/photos.ts) | £0.8039 | £87.82 | £878.83 |
| Egress (!) uncapped per-unit line | Vercel bandwidth (Pro includes 1 TB, then ~GBP 0.12/GB) | £0 | £228.68 | £3,393 |
| Auth | self-hosted better-auth, users/sessions/hashes in Postgres (packages/api/src/auth.ts) | £0 | £0 | £0 |
| Transactional email (!) uncapped per-unit line | Resend (packages/api/src/email.ts): magic links + weekly letters | £0 | £137.90 | £1,398 |
| LLM: weekly letter to every profile (!) uncapped per-unit line | Anthropic claude-opus-5 (apps/web/app/api/cron/weekly/route.ts loops ALL profiles; ~1.6k in / 0.3k out per call, 4.33 calls per registered user per month) | £147.00 | £14,700 | £147,000 |
| LLM: coach chat, free to all (!) uncapped per-unit line | Anthropic claude-opus-5 (packages/api/src/services/coach.ts; ~3k context + 0.2k out, assumed 8 messages per MAU per month; BILLING_ENFORCED unset so no gating) | £152.00 | £15,200 | £152,000 |
| LLM: intake follow-ups, extraction, summary, programme note (!) uncapped per-unit line | Anthropic claude-opus-5 (packages/api/src/ai/tasks.ts; ~18 calls per new user, amortised over 12 months) | £30.00 | £3,000 | £30,000 |
| LLM: body-photo analysis + meal photo/text estimates (!) uncapped per-unit line | Anthropic claude-opus-5 vision (analyseBodyPhotos, estimateMeal; assumed 0.3 photo sets + 5 meal estimates per MAU per month) | £72.00 | £7,200 | £72,000 |
| Video streaming (!) uncapped per-unit line | Mux (@mux/mux-player-react; assumed 0.5 min per DAU per day at ~GBP 0.001/min; YouTube embeds are free) | £3.00 | £300.00 | £3,000 |
| Wearable provider APIs | Oura, Whoop, Strava, Fitbit, Garmin, Polar OAuth (packages/integrations); free developer tiers, Garmin/Polar need partner approval | £0 | £0 | £0 |
| Redis | docker-compose.yml defines redis:7 but no code imports a Redis client; not deployed (docs/DEPLOY.md: 'Redis is not required') | £0 | £0 | £0 |
| Observability | PostHog + Sentry env vars exist but no SDK is imported; priced as if wired (hosted free tiers then usage) | £0 | £40.00 | £300.00 |
| Domain, TLS, DNS, CI minutes | registrar + GitHub Actions (.github/workflows/ci.yml) | £5.00 | £5.00 | £5.00 |
| Staging environment | Vercel preview + Neon branch, smaller | £0 | £30.00 | £120.00 |
| **Total** | | **£409.80** | **£41,339** | **£414,294** |

| Per month | 1,000 users | 100,000 users | 1,000,000 users |
|---|---:|---:|---:|
| MAU / DAU | 400 / 200 | 40,000 / 20,000 | 400,000 / 200,000 |
| Paying users (3% of MAU) | 12 | 1,200 | 12,000 |
| Cost per registered user | £0.4098 | £0.4134 | £0.4143 |
| Cost per paying user | £34.15 | £34.45 | £34.52 |
| Share of revenue (£3.00/paying user) | 1138% | 1148% | 1151% |

Gate 3: **FAIL** - at 1,000,000 users infrastructure is 1151% of revenue per paying user (limit 34%).

Cost per registered user at 1M: £0.41. Cost per paying user at 1M: £34.52. Share of revenue:
1151%. Worst-shaped line: the four LLM lines, £401,000 of the £414,294 total, because every
AI task runs on the most expensive model tier, is free to every user (`BILLING_ENFORCED`
unset in `packages/api/src/services/entitlements.ts`), has no per-user cap, and the weekly
letter is generated for every registered profile whether or not they opened the app that
month. Note that even the 1,000-user column is £410 a month, £34 per paying user, so the
shape is wrong from day one, not only at scale.

Target state (same script, run on a scratchpad copy with the Phase A-C changes below; not
committed as the project model because the project model records the app as found):

| Component | 1,000 users | 100,000 users | 1,000,000 users |
|---|---:|---:|---:|
| Web + API compute (Next standalone container behind Cloudflare; Vercel kept adds ~£2,300 at 1M) | £15.00 | £60.00 | £500.00 |
| PostgreSQL (unchanged) | £0 | £60.00 | £1,400 |
| Object storage, R2 (photos, owned video) | £0 | £6.91 | £70.19 |
| Egress (Cloudflare + R2) | £0 | £0 | £0 |
| Auth (unchanged) | £0 | £0 | £0 |
| Transactional email (letters to active users only) | £0 | £39.90 | £417.90 |
| LLM: premium coach bundle, paying users only (Sonnet-class chat capped at 30/month + photo read; Haiku-class letters + meal estimates; ~£0.34 per paying user) | £4.08 | £408.00 | £4,080 |
| LLM: intake for every new user (Haiku-class, ~18 short calls once) | £3.00 | £300.00 | £3,000 |
| Video (YouTube embeds + owned clips on R2) | £30.00 | £30.00 | £30.00 |
| Redis (rate limit, AI caps) | £0 | £15.00 | £80.00 |
| Observability | £0 | £40.00 | £300.00 |
| Domain, DNS, CI | £5.00 | £5.00 | £5.00 |
| Staging | £0 | £30.00 | £120.00 |
| **Total** | **£57.08** | **£994.81** | **£10,003** |
| Cost per paying user | £4.76 | £0.83 | £0.83 |
| Share of revenue (£3.00) | 159% | 28% | 28% |

Target gate 3: WARN at 28%, under the limit but close; the curve bends (every remaining
per-unit line is tied to paying users or is sub-penny per registered user). At the price
`monetize` would more plausibly set for a coaching product (£4.99 or more) the share falls to
17%, and the free tier keeps the deterministic engine, which already exists and is tested.

Gate 3: FAIL - as found, infrastructure is 1151% of revenue per paying user at 1M
(`architecture/cost-model.json`, run 2026-10-25), driven entirely by ungated Opus-tier LLM
calls per MAU and per registered user; the target state with AI behind `entitlements()`, a
per-task model tier in `packages/api/src/ai/client.ts` and photos in object storage reaches
28%, which is why the decision is IMPROVE rather than STOP.

## 6. Exit plan (gate 5: lift and shift)

| Component | Where state lives | Export method | Format | Lands in | Time | Lock-in |
|---|---|---|---|---|---|---|
| PostgreSQL (all rows, auth, sessions, profiles, programmes, community, ai_log) | Neon (plain Postgres 16); schema in `packages/db/drizzle/0000-0008*.sql` | `pg_dump` / logical replication; `pnpm db:migrate` recreates schema | SQL dump | any Postgres 16 | hours (days at 1M only because photos are inside it) | LOW |
| Auth users, scrypt password hashes, OAuth accounts | `user`, `account`, `session`, `verification` tables (`packages/db/src/schema/auth.ts`) | part of `pg_dump`; cookies re-issued by setting `BETTER_AUTH_URL` | SQL | any host running the same better-auth config | hours | LOW |
| Progress photos | `progress_photo.data` bytea on Vercel; `.uploads/<userId>/` on local disk (`packages/api/src/services/photos.ts`) | `pg_dump` or `rsync` of `STORAGE_DIR`; target: `rclone sync` of the bucket | bytes | any disk or S3-compatible bucket | hours (large dump) | LOW, but heavy |
| Wearable OAuth tokens and raw health payloads | `connected_provider.credentials`, `health_sample.raw`, AES-256-GCM with `HEALTH_DATA_ENCRYPTION_KEY` | part of `pg_dump` plus the key from the secret store; without the key users re-connect providers | SQL + 32-byte key | any Postgres | hours | LOW |
| Transactional email | none (Resend is stateless); templates inline in `packages/api/src/auth.ts` and `coach.ts` | re-create DNS (SPF/DKIM) at the next provider; swap `sendEmail()` in `packages/api/src/email.ts` | n/a | any SMTP/API provider | hours | LOW |
| AI | none at the vendor; prompts in `packages/api/src/ai/prompts.ts`, every call through `structured()` in `client.ts`; logs in `ai_log` | nothing to export; `messages.parse` + `zodOutputFormat` are SDK-specific so a provider swap rewrites one file | n/a | any model with JSON output | days | MEDIUM |
| Video | assets at Mux; `exercise_video` rows hold `assetId`, `playbackId`, `license`, `isPlaceholder`; originals in the owner's studio footage | re-upload originals via `packages/db/scripts/upload-videos.ts` to the next host; YouTube embeds unaffected | mp4 | R2 + HLS, or another video host | days per 150 clips | MEDIUM |
| Scheduling | `apps/web/vercel.json` cron (Monday 06:00) hitting a plain bearer-protected GET | system cron or a container worker calling `/api/cron/weekly` with `CRON_SECRET` | n/a | anywhere | one hour | LOW |
| Compute | Vercel serverless; `process.env.VERCEL` read inside `photos.ts`, `maxDuration` export in `apps/web/app/api/nutrition/estimate/route.ts`; no `@vercel/*` imports (grep) | `next build` with standalone output into a Dockerfile that does not yet exist | container image | any VM or container host | one day | LOW |
| Offline set queue | IndexedDB in the user's browser (`apps/web/lib/offline-queue.ts`) | replays itself to whatever host answers the same URLs | n/a | n/a | none | LOW |
| Secrets and config | environment variables, `.env.example` documents all 40 | copy to the next secret store | env | anywhere | one hour | LOW |

Weekend test: Saturday morning, write a 20-line Dockerfile (`pnpm install --frozen-lockfile`,
`pnpm --filter @kettleworth/web build`, `next start`), `pg_dump` the Neon database and
`pg_restore` into Postgres on a Hetzner VM with the existing `docker-compose.yml` extended by
the web image, copy the 40 env vars with `STORAGE_DIR` set and `PHOTO_STORAGE` unset, add a
crontab line that curls `/api/cron/weekly` with the bearer secret, point DNS at Caddy. Mux
and YouTube keep serving video from their side. The step that hurts is the dump: with photos
as bytea it is tens of gigabytes per 10k active uploaders, which is acceptable this year and
the reason object storage is Phase A. The one line of business logic that knows the host,
`inDb()` in `packages/api/src/services/photos.ts`, defaults the right way when `VERCEL` is
absent. The app runs by Sunday.

Adapters that make this true: `packages/api/src/email.ts` -> Resend;
`packages/api/src/ai/client.ts` (`structured()`) -> Anthropic SDK;
`packages/api/src/services/photos.ts` (`savePhoto`/`readPhoto`/`deletePhoto`) -> disk or
Postgres today, bucket tomorrow; `packages/integrations/src/registry.ts` -> the six wearable
APIs; `packages/db/src/index.ts` (`db()`) -> `postgres.js` over any Postgres;
`packages/api/src/auth.ts` -> better-auth over the Drizzle adapter.

Gate 5: WARN - every stateful component is LOW or MEDIUM and the schema, hashes, tokens and
logs all leave in one `pg_dump`; WARN because the repo has no Dockerfile or image build for
the app (`docker-compose.yml` runs only Postgres and Redis), scheduling exists only in
`apps/web/vercel.json`, and the host check `process.env.VERCEL` sits inside business logic in
`packages/api/src/services/photos.ts` rather than in config.

## 7. What we are not building

- A job system (BullMQ, Inngest, Trigger.dev, Kafka): the only async work is a weekly batch
  and user-triggered syncs; a cursor over a Postgres table inside the existing cron endpoint,
  or one container worker, covers 250k jobs a day. BullMQ was named in `docs/BRIEF.md` and
  never added; keep it that way.
- Hosted auth (Clerk, Auth0, Supabase Auth): per-MAU pricing would add £8,000-20,000 a month
  at 400k MAU to a product whose whole budget at 1M is £10,000; the self-hosted tables pass.
- Supabase client SDK or RLS: authorisation stays in `packages/api` services keyed by
  `userId`; the database is spoken to only from the server.
- A search engine: 855 exercises and 46 recipes are a Postgres query.
- Microservices or a separate API host: route handlers are thin wrappers over `packages/api`;
  if Expo needs a non-Next API, the same package mounts in Express in a day.
- Opus-tier models for every task: the deterministic engine is the product; AI is narrative
  and should be priced as such per task.
- Photos in Postgres as the permanent design: it is a serverless workaround with a comment
  saying so.
- A rewrite off Next.js or Vercel: no vendor runtime API is imported; the egress line, not the
  framework, decides whether the app moves to a container, and that is Phase C, optional.
- Expo mobile app, HealthKit, community features at scale: Phase 2 and 3 in `docs/BRIEF.md`;
  not reviewed here beyond noting the tables exist and are plain Postgres.
- Anything in beta, canary or "coming soon": none is used and none is proposed.

## 8. Current state (existing apps only)

| Item | As found | Evidence |
|---|---|---|
| Language, runtime | TypeScript 5.9 on Node >=22; pnpm 12.4.1; Turborepo 2.10 | `package.json`, `.github/workflows/ci.yml` |
| Web framework | Next.js 16.3.5 (App Router, route handlers), React 19.3.0, webpack build | `apps/web/package.json`, `apps/web/next.config.ts`, `pnpm-lock.yaml` |
| UI | Tailwind 4.3, Radix, `motion` 13, Recharts 3, Serwist 9 PWA, `@zxing` barcode scanner | `apps/web/package.json`, `packages/ui/package.json` |
| Domain engine | `packages/core`, pure functions, Vitest (16 test files across core/integrations) | `packages/core/`, `pnpm test` |
| Data store | PostgreSQL 16; Docker locally (port 5434), Neon Free in prod; Drizzle 0.45 + `postgres.js` 3.4, `max: 10, prepare: false`; 9 migrations, snapshots and seed in repo | `docker-compose.yml`, `packages/db/src/index.ts`, `packages/db/drizzle/`, `docs/DEPLOY.md` |
| Blobs | Progress photos as `bytea` in `progress_photo.data` on Vercel; local `.uploads/` in dev | `packages/api/src/services/photos.ts`, `packages/db/src/schema/profile.ts` |
| Cache / queue | Redis 7 in compose, unused by code; no queue; `sync_job` status table with no consumer | `docker-compose.yml`, grep `ioredis\|bullmq\|redis` = 0 imports |
| Auth | better-auth 1.7.4, Drizzle adapter, email+password (min 10 chars), magic link, optional Google/Apple; 30-day cookie sessions in Postgres; rate limit in process memory | `packages/api/src/auth.ts`, `packages/db/src/schema/auth.ts`, `apps/web/lib/auth-client.ts` |
| Encryption | AES-256-GCM field encryption for health notes, OAuth tokens, raw samples | `packages/db/src/crypto.ts`, `packages/db/src/schema/integrations.ts` |
| AI | `@anthropic-ai/sdk` 0.125, `claude-opus-5` default, `messages.parse` + `zodOutputFormat`, 10 tasks, full prompt/output logged to `ai_log`, null fallback | `packages/api/src/ai/client.ts`, `tasks.ts`, `services/coach.ts` |
| Email | Resend 6 behind `sendEmail()`; console in dev | `packages/api/src/email.ts` |
| Video | Mux player + signed webhook; YouTube embeds from allowlist via seed scripts | `apps/web/app/api/webhooks/mux/route.ts`, `packages/db/scripts/` |
| Wearables | Oura, Whoop, Strava, Fitbit, Garmin, Polar OAuth adapters; sync inline in request | `packages/integrations/src/adapters/`, `packages/api/src/services/integrations.ts` |
| Billing | `subscription` table, `entitlements()`; `BILLING_ENFORCED` unset => everything premium for everyone | `packages/db/src/schema/billing.ts`, `packages/api/src/services/entitlements.ts` |
| Hosting, deploy | Vercel Hobby, region lhr1, one weekly cron; `vercel --prod` by hand; no Dockerfile; CI runs typecheck, unit, migrate+seed, build, Playwright e2e on push | `apps/web/vercel.json`, `docs/DEPLOY.md`, `.github/workflows/ci.yml` |
| Observability | PostHog/Sentry env vars only, no SDK imported; `audit_log` table | `.env.example`, grep |
| Secrets | `.env`, `.env.local`, `apps/web/.env` present locally and gitignored; `.env.example` documents all keys | `.gitignore`, `git ls-files` |
| In-process state | None that breaks multi-instance (React `cache()` per request, lazy singletons for db/auth/clients); rate-limit counters are per instance | grep for module-level `Map`/`Set`/`setInterval` |
| Revenue | none set; "Free for now" | `docs/BRIEF.md` |

Gate scores as found: G1 WARN, G2 PASS, G3 FAIL, G4 WARN, G5 WARN.

## 9. Plan (Convert mode only)

Written because gate 3 fails; every phase is a component or configuration change behind an
existing adapter, not a rewrite, and the app keeps serving through each one.

| Phase | Scope | Rollback | Success check | Status |
|---|---|---|---|---|
| A Data | Add an S3-compatible branch to the three functions in `packages/api/src/services/photos.ts` (`PHOTO_STORAGE=s3`, R2 bucket, `storageKey` already exists), backfill existing bytea rows, then null the column. Add `ai_log` retention (keep 30 days in full, then token counts and validity only) and monthly partitioning for `health_sample` and `exercise_instance` as new Drizzle migrations. | Set `PHOTO_STORAGE` back to `db`; bytea rows are untouched until the backfill is verified. Partitioning migration is additive. | Photo count and byte checksums match between bucket and rows for a week; `pg_dump` size drops; `ai_log` row count plateaus. | not started |
| B Boundary | In `packages/api/src/ai/client.ts`: per-task model tier (`task -> model`) and a per-user monthly call budget checked before the request; in `entitlements()` an `aiCoach` flag so free users get the deterministic path that already exists; weekly cron rewritten to select users active in the last 14 days with an `aiCoach` entitlement, in batches of 200 with a cursor, each batch its own invocation or one container worker; better-auth `rateLimit.storage` moved to `secondaryStorage` (Redis) or `database`. Wire the Stripe webhook into `subscription` (monetize skill). | Every change is behind an env flag (`AI_TIERING`, `AI_GATING`, `CRON_BATCHED`); flipping it restores today's behaviour. | Weekly `ai_log` token totals divided by MAU stay under £0.01 per MAU for a month; cron completes inside its window at 100k users; rate limit counts are shared across instances. | not started |
| C Cut-over | Add a Dockerfile (Next standalone) and a web service to `docker-compose.yml`; put Cloudflare in front for cache and egress; move the cron trigger to the worker or system cron; decide Vercel vs container on the actual egress bill at 100k users. | DNS back to Vercel; the Vercel project stays deployable for a month. | Error rate and p95 latency equal or better for a week; egress line on the bill goes to zero. | not started |
| D Delete | Remove the bytea photo path, the unused Redis service if Phase B did not adopt it, the `VERCEL` host check in business logic, and `ai_log` full-prompt storage beyond the retention window. Re-run `scripts/cost-model.py` against the real bill and update this record to a single current state. | n/a | Cost model matches the invoice within 20%. | not started |

## Decision

Decision: IMPROVE

Gate 3 fails as found (£34.52 per paying user at 1M, 1151% of a £3 revenue line) because every
AI task runs ungated on the most expensive model tier for every user, including a weekly
letter to every registered profile; the same code with AI behind `entitlements()`, a per-task
model tier in the single `structured()` wrapper and photos in object storage prices at £0.83
per paying user (28%), so the fix is configuration and three adapters, not a rewrite. Gates 1,
4 and 5 are WARN with in-place fixes, gate 2 passes, and gate 3 was the closest call.

# Deploying Kettleworth (free tier)

Web app on Vercel Hobby, Postgres on Neon Free. Both are free for personal use. Redis is not required.

## One-time setup
1. `vercel login` (opens the browser) and `neonctl auth` (same).
2. Create the database: `neonctl projects create --name kettleworth --region-id aws-eu-west-2`.
3. `cd apps/web && vercel link` (create a new project, root directory `apps/web`).
4. Set environment variables on the Vercel project (Production):
   - `DATABASE_URL` from `neonctl connection-string --pooled`
   - `BETTER_AUTH_SECRET` and `HEALTH_DATA_ENCRYPTION_KEY`: 32 random bytes each (`openssl rand -base64 32`)
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`: the deployed URL, e.g. `https://kettleworth.vercel.app`
   - `PHOTO_STORAGE=db`, `CRON_SECRET` (random), `AI_MODEL=claude-opus-5`
   - `ANTHROPIC_API_KEY` for live coaching; without it the app runs on deterministic fallbacks
   - Optional: `RESEND_API_KEY` + `EMAIL_FROM` for magic links and letters, wearable OAuth keys, `YOUTUBE_API_KEY`
5. Migrate and seed the production database from your machine:
   `DATABASE_URL=<neon url> pnpm --filter @kettleworth/db migrate && DATABASE_URL=<neon url> pnpm --filter @kettleworth/db seed`
6. `vercel --prod` from `apps/web`.

## Every later release
`git commit` then `vercel --prod` (or connect the repo to Vercel for deploys on push). New migrations: run step 5's migrate command first.

## Notes
- Body photos are stored in Postgres on Vercel (`PHOTO_STORAGE=db`) because serverless disks are ephemeral.
- The weekly letter and adaptation cron runs Monday 06:00 UTC (`apps/web/vercel.json`).
- Hobby plan limits: 100 GB bandwidth, serverless functions up to 10 s by default (AI calls use the 60 s function timeout set in the route config where needed).

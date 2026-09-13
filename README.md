# Kettleworth

A coach in your pocket: personalised training, nutrition and recovery that adapt to what you actually do. Web first (PWA), mobile next. See `docs/BRIEF.md` for the architecture and design brief.

## Run locally

```bash
cp .env.example .env            # then set BETTER_AUTH_SECRET and HEALTH_DATA_ENCRYPTION_KEY (openssl rand -base64 32)
docker compose up -d            # Postgres on 5434, Redis on 6380
pnpm install
pnpm db:migrate && pnpm db:seed # 855 exercises, 46 recipes
pnpm dev                        # http://localhost:3000
```

Optional: `ANTHROPIC_API_KEY` turns on the AI coach (follow-up questions, summaries, coach notes). Without it the product runs fully on the deterministic engine with templated copy. Provider client IDs (Oura, Whoop, Strava, Fitbit, Garmin, Polar) enable each Connected App.

## Scripts
`pnpm test` (Vitest, core + integrations) · `pnpm typecheck` · `pnpm test:e2e` (Playwright) · `pnpm db:studio`.

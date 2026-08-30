# RUNBOOK

Status: Current.
Load this file only if the task contains or implies: run / command / script / setup / start / test / check / lint / build / deploy / migrate / seed / install.

---

## Setup
- `npm install`
- Yatzy online multiplayer needs a Supabase project: run `supabase/migrations/0001_yatzy.sql` against it, then fill in `public/games/yatsy/supabase-config.js` (`url` + `anonKey`, public values) and set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as Vercel project env vars (server-only, never committed).
- Admin stats page needs the same Supabase project: run `supabase/migrations/0002_events.sql` (creates `muchogames_events`), then set `ADMIN_PASSWORD` as a Vercel project env var. Nothing else to configure; it reuses `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.

## Development
- `npm run dev` — starts the Vite dev server.
  - Hub: `http://localhost:5173/`
  - Wordplayer game (e.g. Pictionary): `http://localhost:5173/wordplayer.html?game=pictionary`
  - Admin stats: `http://localhost:5173/admin/index.html` (the trailing `index.html` is required in dev; on Vercel `/admin` also works)
- The serverless functions under `api/` do not run under `npm run dev` (Vite only serves static files), so the admin page shows a 404 error and no launch is recorded. Use `vercel dev` instead to run the full app (static + functions) locally, with `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`ADMIN_PASSWORD` set via `vercel env pull` or a local `.env`.

## Test
- No automated test suite exists yet (see `docs/TECH.md` Open_Questions).
- Manual check: `npm run check` (lint + format-check + build).

## Build
- `npm run build` — production build via Vite, output in `dist/`.
- `npm run preview` — serve the production build locally.

## Lint / Format
- `npm run lint` — ESLint (`eslint.config.mjs`).
- `npm run format` — Prettier write.
- `npm run format:check` — Prettier check only.

## Deploy
- Hosting target: Vercel (static `dist/` build + `api/yatsy/games/*` serverless functions), connected via Vercel's Git integration.
- CI (`.github/workflows/ci.yml`) runs lint + format-check + build on push/PR to `main`/`master`. It does not deploy.
- Actual deploy is handled by Vercel (preview deployments per PR, production on merge to `main`/`master`); not scripted in this repo. `vercel --prod` also works from a machine with the Vercel CLI authenticated against this project.

## Troubleshooting
- New game not showing on the hub: verify the entry exists in `public/hub-config.json` and that `assets/thumbnail.jpg` exists under `public/games/<id>/`.
- Wordplayer game not loading words: verify `public/data/<id>/<id>_words.json` exists and its path matches the `data` field in `public/hub-config.json`.
- Yatzy multiplayer not syncing: check `public/games/yatsy/supabase-config.js` has valid values, that `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are set on the Vercel project, and that `yatzy_game_events` is added to the `supabase_realtime` publication (see `supabase/migrations/0001_yatzy.sql`).
- Admin page rejects the right password: confirm `ADMIN_PASSWORD` is set on the Vercel project for the environment being used (Production and Preview are separate), and redeploy - env var changes only apply to new deployments.
- Admin page shows zero launches: the counters only start from the moment `supabase/migrations/0002_events.sql` ran and a deployment containing the `hub.js` tracking hook went live. Verify with `curl -X POST https://<host>/api/track -d '{"gameId":"yatsy"}'`, which should return `{"recorded":true}`.

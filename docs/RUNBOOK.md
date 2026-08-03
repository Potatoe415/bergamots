# RUNBOOK

Stack: React + Vite + Tailwind (client) · Vercel Serverless Functions (api) · Supabase Postgres/Auth/Realtime · npm workspaces

---

## Setup

```bash
npm install          # installs all workspaces from the repo root
```

Copy the env examples and fill in the Supabase project's real values (same project as coinchapp — get them from its dashboard or its own `.env.local`):

```bash
cp .env.example .env.local                  # SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
cp client/.env.example client/.env.local     # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```

---

## Development

Run both the API functions and the client (requires `concurrently` + the `vercel` CLI, both installed via `npm install`):

```bash
npm run dev          # from repo root — starts api on :3001 and client on :5173
```

Or start individually:

```bash
npm run dev:api      # vercel dev — serves /api/* on http://localhost:3001
npm run dev:client   # Vite dev server on http://localhost:5173
```

The client always calls same-origin `/api/*` paths — `client/vite.config.ts`
proxies `/api` to `http://localhost:3001` in dev, so both pieces work
together without any extra env var.

---

## Test

```bash
npm test             # runs shared/gameEngine unit tests via Vitest
```

Type-check the API functions (no build step — Vercel transpiles them at deploy time):

```bash
npx tsc --noEmit -p tsconfig.json
```

---

## Build

```bash
npm run build -w client   # builds client to client/dist/
```

---

## Deploy

Single Vercel project, deployed from the repo root (see [vercel.json](../vercel.json)):
builds the client to `client/dist/` and deploys `api/*.ts` as serverless functions.

Environment variables to set on the Vercel project (same values as coinchapp's Supabase project):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (used at client build time)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (used at runtime by `/api/*`)

```bash
git push   # Vercel auto-deploys on push, per the connected project's settings
```

---

## Troubleshooting

**"not_authenticated" from any /api/* call:** the browser has no Supabase
session yet — `ensureAnonAuth()` (`client/src/lib/supabase.ts`) should sign in
anonymously before the first call. Check `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
are set.

**Moves don't show up for the other player:** check the Supabase Realtime
publication includes `game_events` (it should already, from coinchapp's
`supabase/migrations/0001_init.sql`) and that the browser console isn't
reporting a `CHANNEL_ERROR`/`TIMED_OUT` on the `game-<id>` channel. A 15s
poll (`client/src/lib/useOnlineGame.ts`) is a safety net either way.

**"room_full" when it shouldn't be:** a seat is only reclaimable once its
`last_seen_at` is older than `PRESENCE_STALE_MS` (30s) — see `api/_lib/repo.ts`.

**500 on any `/api/*` call, logs say `Cannot find module '.../node_modules/@tranquillity/shared/src/index.ts'`:**
`shared` must be pre-compiled to plain JS — Vercel's serverless Node runtime
resolves `@tranquillity/shared` through the real npm-workspace symlink and
`package.json`'s `main` field, and cannot execute a raw `.ts` file the way
Vite/esbuild can for the client. `npm run build -w shared` (already wired
into `vercel.json`'s `buildCommand` and the root `dev`/`dev:api` scripts)
must run — and succeed — before `api/*` or the client are built. Check with
`vercel logs <deployment-url>` (or `vercel logs <deployment-url> --json` for
the untruncated message).

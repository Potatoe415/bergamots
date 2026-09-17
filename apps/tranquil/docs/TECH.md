# TECH

Status: Living document. Never edit autonomously — confirm with user first.

---

Stack_Frontend: React 18 + Vite + Tailwind CSS, single-page app (npm workspaces: `shared`, `client`)
Stack_Backend: Vercel Serverless Functions (`api/*.ts`, Node/TypeScript) — reuses the `@tranquillity/shared` pure game engine
Database: Supabase Postgres — same project as the sibling `coinchapp` app, reusing its `games`/`game_players`/`game_events` tables (`game_type='tranquillity'`); no dedicated migration in this repo (see `docs/DATA_MODEL.md`)
Runtime: Node.js (Vercel serverless), browser (Vite SPA)
Package_Manager: npm
Hosting: Vercel (single project — static client build + `/api` serverless functions)
Authentication: Supabase anonymous sign-in (`supabase-js`, session persisted in browser `localStorage`)
Authorization: RLS denies direct client access to `games`/`game_players`; only the service-role client (`api/_lib/supabaseAdmin.ts`) reads/writes them. Every `/api/*` call resolves the caller's seat from their verified Supabase JWT (`api/_lib/auth.ts`).
Security: Hidden hand data (`GameState`) is redacted per seat by `buildClientState` (shared engine) before any response leaves the API — the browser never receives the opponent's hand.
Testing: Vitest (pure rules engine in `shared/`)
Deployment: Git push → Vercel build (see `docs/RUNBOOK.md`)

Conventions:
- Language: English (code, comments, commits)
- Naming: camelCase (TS), kebab-case (API route filenames), snake_case (Postgres columns)
- Formatting: TBD
- Error_Handling: API endpoints return `{ error: string }` with a stable error code (e.g. `"room_full"`, `"not_in_game"`) and the matching HTTP status; the client surfaces `error.message`.
- Logging: none custom yet

Architecture_Principles:
- Keep the system understandable.
- Avoid premature abstraction.
- Prefer explicit over implicit.
- Isolate vendor-specific code where practical — all Supabase access goes through `api/_lib/` (server) and `client/src/lib/supabase.ts` (browser).
- The game engine (`shared/`) stays pure and framework-agnostic; local, vs-bot, and online modes all call the same `applyPlayCard`/`applyDiscardTwo`/`applyContributeStartDiscard`/`buildClientState` functions.
- Realtime is a lightweight tick (`game_events` insert + broadcast) that triggers a redacted refetch (`GET /api/get-view`) — no secret data flows over Realtime itself.
- Document non-obvious decisions in `docs/DECISIONS.md`.

Key_Modules:
- `shared/src`: types, `gameEngine` (init/move/redact), `gridFeasibility`, `botAI` — pure, unit-tested.
- `api/_lib`: `supabaseAdmin` (service-role client), `auth` (JWT → user id), `repo` (load/persist/version-guard), `handleMove` (shared plumbing for the 3 move endpoints).
- `api/*.ts`: `join`, `get-view`, `play-card`, `discard-two`, `contribute-start-discard` — one Vercel Serverless Function each.
- `client/src/lib`: `supabase` (browser client + anonymous auth), `api` (fetch wrappers), `useOnlineGame` (realtime subscription + connection state, mirrors coinchapp's `useGameView`).

Open_Questions:
- No idle-turn timer or bot-takeover for online tranquillity yet (coinchapp has one) — add later if disconnections become an issue in practice.
- `api/join.ts`'s create-then-insert-seat sequence isn't fully race-proof under simultaneous requests for the same room code — acceptable for a 2-player casual game, revisit if it causes real issues.

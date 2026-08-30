# TECH

Status: Living document. Never edit autonomously — confirm with user first.

---

Stack_Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3. No UI framework (no React/Vue/Angular). Vite as dev server and bundler.
Stack_Backend: Vercel Serverless Functions (Node.js) back the two dynamic features: `api/yatsy/games/*` is the server-side authority for Yatzy matchmaking/real-time state sync, and `api/track.js` + `api/admin/stats.js` record and aggregate hub launch counts. The rest of the site remains static.
Database: No general-purpose database. Game content is static JSON shipped in `public/data/` and `public/hub-config.json`. Supabase (Postgres) stores only ephemeral Yatzy room state and append-only hub launch events (see `docs/DATA_MODEL.md`), using the shared `multigames-db` Supabase project (also used by `coinchapp`), with tables namespaced (`yatzy_*`, `muchogames_*`) to avoid collisions.
Runtime: Node.js for tooling (Vite, ESLint, Prettier, CI) and for the `api/yatsy/games/*` serverless functions. Browser runtime for the app itself.
Package_Manager: npm
Hosting: Vercel, serving the Vite build output (`dist/`) plus the `api/` serverless functions from the same project. Must stay within the free Hobby plan.
Authentication: None for players (anonymous by default). The admin stats page uses a single shared password compared server-side against the `ADMIN_PASSWORD` env var in `api/admin/stats.js` — no accounts, no sessions, no tokens, no auth provider. Deliberately weak by user decision (see `docs/DECISIONS.md` 2026-08-30); it protects read-only aggregate counts, nothing else.
Authorization: Capability-based, not identity-based. Yatzy multiplayer access is gated only by a 3-letter room code plus a per-seat resume token, enforced server-side by `api/yatsy/games/*` plus Supabase RLS blocking all direct client access. Admin stats access is gated by knowing `ADMIN_PASSWORD`. `POST /api/track` is intentionally unauthenticated, so launch counters can be inflated by anyone who finds the URL.
Security: No secrets committed. `.env*` files are ignored (see `.env.example`). Supabase client config (`public/games/yatsy/supabase-config.js`, URL + anon key) is public, not a secret — protected by Row Level Security, not secrecy. `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` are server-only, set as Vercel env vars, never committed. The admin password is never sent to the browser: the browser posts a candidate and the function answers yes or no.
Testing: No automated test suite currently. CI enforces lint, format-check, and build only.
Deployment: GitHub Actions CI (`.github/workflows/ci.yml`) runs `npm run lint`, `npm run format:check`, `npm run build` on push/PR to `main`/`master` (does not deploy). Actual deployment is Vercel's own Git integration: every push to `main` auto-deploys to production (`https://bergamots.vercel.app`), independent of the GitHub Actions CI.

Conventions:
- Language: English for code, filenames, comments, and docs. In-game copy is multilingual (FR/EN/ES) via JSON fields.
- Naming: kebab-case for game ids and folders (`public/games/<id>/`); camelCase for JS identifiers.
- Formatting: Prettier (`.prettierrc`) and ESLint (`eslint.config.mjs`) are the enforced source of truth. Run `npm run format` / `npm run lint`.
- Error_Handling: No formalized project-wide pattern yet. Follow existing per-module style (e.g. `matchmaking.js` throws tagged `Error` objects with a `.code`).
- Logging: Console-based only; no structured logging.

Architecture_Principles:
- Hub-spoke: a central hub (`index.html` + `hub.js`) reads `public/hub-config.json` and links out to standalone, full-page game apps.
- Config over code: adding a wordpack game only requires a data JSON under `public/data/<id>/` plus a `hub-config.json` entry — no changes to `hub.js` or `vite.config.js`.
- Shared code lives in `shared/js/` (`engine.js`, `dom.js`) and `shared/css/` (`base.css`, `wordplayer.css`), reused by the wordplayer engine and by games that opt in (e.g. Olé Mains).
- Each custom game is isolated in its own `public/games/<id>/` folder; no forced code sharing beyond `shared/`. The admin page follows the same pattern in `public/admin/`: plain unbundled HTML/CSS/JS, so it needs no `vite.config.js` entry and is reached at `/admin/index.html`.
- Analytics is instrumented in one place only (a click listener on hub tiles in `hub.js`, via `shared/js/analytics.js`), never inside individual games. Every game is launched from the hub, so one hook covers them all.
- Full browser navigation between games (`window.location.href`), no SPA router. The browser's own teardown (garbage collection on navigation) handles cleanup between games.
- Keep the system understandable. Avoid premature abstraction. Prefer explicit over implicit. Document non-obvious decisions in `docs/DECISIONS.md`.

Open_Questions:
- No formalized error-handling/logging strategy — decide if/when a shared pattern is needed.
- No automated tests — decide if/when to add coverage (Yatzy scoring in `scoring.js` and `shared/js/engine.js` are the highest-value candidates).
- Known duplication: rules-modal loading logic (`loadRulesIfExists`-style) is reimplemented similarly across several games instead of shared once.

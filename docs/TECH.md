# TECH

Status: Living document. Never edit autonomously — confirm with user first.

---

Stack_Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3. No UI framework (no React/Vue/Angular). Vite as dev server and bundler.
Stack_Backend: None (static site). Firebase Realtime Database is used exclusively for Yatzy matchmaking/real-time state sync.
Database: No general-purpose database. Game content is static JSON shipped in `public/data/` and `public/hub-config.json`. Firebase Realtime Database stores only ephemeral Yatzy room state (see `docs/DATA_MODEL.md`).
Runtime: Node.js for tooling (Vite, ESLint, Prettier, CI). Browser runtime for the app itself.
Package_Manager: npm
Hosting: Firebase Hosting, serving the Vite build output (`dist/`) — see `firebase.json`.
Authentication: None. Anonymous by default.
Authorization: None. Yatzy multiplayer access is gated only by a 3-letter room code plus a per-seat resume token (no auth).
Security: No secrets committed. `.env*` files are ignored. Firebase client config (`public/games/yatsy/firebase-config.js`) is a public client key, not a secret.
Testing: No automated test suite currently. CI enforces lint, format-check, and build only.
Deployment: GitHub Actions CI (`.github/workflows/ci.yml`) runs `npm run lint`, `npm run format:check`, `npm run build` on push/PR to `main`/`master`. Deployment to Firebase Hosting is manual/external to this repo (not wired into CI).

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
- Each custom game is isolated in its own `public/games/<id>/` folder; no forced code sharing beyond `shared/`.
- Full browser navigation between games (`window.location.href`), no SPA router. The browser's own teardown (garbage collection on navigation) handles cleanup between games.
- Keep the system understandable. Avoid premature abstraction. Prefer explicit over implicit. Document non-obvious decisions in `docs/DECISIONS.md`.

Open_Questions:
- No formalized error-handling/logging strategy — decide if/when a shared pattern is needed.
- No automated tests — decide if/when to add coverage (Yatzy scoring in `scoring.js` and `shared/js/engine.js` are the highest-value candidates).
- Known duplication: rules-modal loading logic (`loadRulesIfExists`-style) is reimplemented similarly across several games instead of shared once.

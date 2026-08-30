# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. A full technical audit was run on 2026-08-30 (score 4.75/10, verdict "production-ready under conditions"). Priorities 1 to 4 of its 5-point plan are done and priority 5 is half done: no unauthenticated mutating Yatzy endpoint remains, the site ships security headers plus a throttle plus token-based admin auth, every serverless handler logs its failures, `npm run check` (lint + format + build) now exits 0 for the first time, and the dead design tokens are cleaned up. The ~16.9 MB of dead assets is audited and listed but deliberately not deleted yet - the user reviews it first. Nothing is live yet - none of this is deployed, and `/admin` still needs the migration plus `ADMIN_PASSWORD`.
Current_Goal: Deploy priorities 1 to 5 together and verify Yatzy online play plus the `/admin` login in production, then decide on the deletions listed in `docs/BACKLOG.md`.
Last_Action: Audit priority 5. Measured everything in the browser before touching it, which paid off: the audit's own recommendation - change `::root` to `:root` in `public/shared/css/base.css` - turned out to be actively harmful. Injecting the corrected block at runtime showed `body` colour going to `rgb(229, 231, 235)`, light grey on the beige gradient, on the hub and on `wordplayer.html` (10 elements inherit it); `/admin` and Pyramide were safe only because they set their own colour. The 14 tokens are a dark theme the design abandoned, and only `--font-sans` and `--color-text` had any consumer, both inside `base.css` itself. So the block was replaced by a `:root` holding `--font-sans` alone and `color: var(--color-text)` was dropped from `body`: the serif fallback is fixed, no colour changes, `base.css` goes 60 to 50 lines. Confirmed the font fix is latent rather than visible - only `body` and a `<script>` were inheriting Times New Roman. The rest of priority 5 was audited but not applied by user choice: ~16.9 MB of unreferenced dead weight (three `old*.jpg` at the repo root including an empty one, `banner-games-hub-old.jpg`, the three `questions_*.json`, *both* unimported `dom.js` copies, and `easyfrog/style.css` for a game that is external), plus two findings - `banner-games-hub-mobile.jpg` is byte-identical to the desktop banner so the `srcset` is a placebo, and the two `engine.js` copies differ only in JSDoc comments, so it is duplication and not the silent fork it looked like. All of it is itemised in `docs/BACKLOG.md`. Verified with `npm run check` green and a browser pass on the hub and wordplayer.

Next_Actions:
- Deploy, then verify Yatzy online end to end in production: create, join, leave, reload-to-resume, and reclaiming a seat by re-typing the code on the same device.
- After deploy, confirm `/admin` login works against the real `ADMIN_PASSWORD`, that a wrong password is refused, and that the session survives a page reload for up to 1h. The full happy path could not be tested locally: `npm run dev` does not serve `api/`, and `vercel dev` needs the Supabase secrets.
- Confirm the winner banner still looks right after the `innerHTML` to `textContent` change - it was not exercised end to end locally, since it needs a full 13-round game. Styling is safe (`.winner-card h2` / `.winner-card p` are plain descendant selectors) and the DOM structure is identical.
- User to run `supabase/migrations/0002_events.sql` against `multigames-db` (creates `muchogames_events` with RLS and no policies).
- User to set `ADMIN_PASSWORD` as a Vercel env var (Production, and Preview if wanted), then redeploy - env var changes only apply to new deployments. Use a long random value: it is now also the token signing key.
- After deploy, check the Vercel function logs show the new one-line JSON records when something fails, and that no client-visible response carries Postgres detail any more.
- Watch the first CI run on push: it has been red since it was written, so the build step has almost certainly never actually executed on GitHub. `npm ci` is also new there (verified in sync locally with `npm ci --dry-run`).
- Decide whether to keep the 22 auth/throttle/observability assertions as the project's first test file - they were written, run green, then deleted, because adding a test convention is a decision for the user (see the open item in BACKLOG "Next").
- User to delete/decommission the Firebase project (Hosting + Realtime Database) whenever ready - confirmed safe, no game depends on it.
- Be aware Sync-Push/Pull use mtime-based conflict resolution, not real git merge - double-check important changes were not silently overwritten after each sync.
- Confirm with user whether to keep or delete `refactor.py` (one-off, already-applied migration script at repo root).

Open_Questions:
- `GET /api/yatsy/games/[code]` is still unauthenticated: knowing a 3-letter code exposes room state read-only. Left open deliberately (out of the agreed fix scope). Decide whether to close it or accept it.
- Room codes stay at 3 letters (17,576 combinations, enumerable in seconds) by user decision. Rate limiting is the planned mitigation - confirm that is enough, or revisit code length later.
- A player who loses their `localStorage` can no longer re-enter a game in progress at all. Previously possible only via the seat-hijack path that was just closed. Confirm this is acceptable.
- Retention: `muchogames_events` is append-only with no purge job. Decide if a TTL is ever wanted, or if keeping all history forever is fine (volume is tiny).
- Rename: only `muchogames_events` uses the new name. Decide when to rename the repo, the Vercel project, and the `yatzy_*` tables.
- Whether to raise `printWidth` from 80 to 100. Measured during priority 4: it would cut the remaining game-code churn from 20,633 to 18,075 lines. Not applied - changing a formatting convention is the user's call.

Known_Issues (pre-existing, flagged by the audit, tracked in `docs/BACKLOG.md`):
- `public/games/**` is excluded from `format:check` on purpose, so 79 game files are still unformatted and the gate does not cover them. The ratchet is documented in `.prettierignore`; Yatzy should be swept first since it is actively developed. Lint also still tolerates 16 warnings.
- ~16.9 MB of unreferenced dead weight is still shipped to production, audited and itemised in `docs/BACKLOG.md`, left in place until the user reviews it: three `old*.jpg` at the repo root (one of them empty), `banner-games-hub-old.jpg`, the three `questions_*.json`, both unimported `dom.js` copies, and `easyfrog/style.css`.
- `public/assets/banner-games-hub-mobile.jpg` is byte-identical to the desktop banner, so the `srcset` in `index.html` is a placebo: phones download the full 554 KB image.
- `shared/js/engine.js` and `public/shared/js/engine.js` are duplicated (identical code, only the JSDoc differs). The split is structural - Vite bundles the root copy for `wordplayer.js`, games under `public/` are served verbatim - and was deliberately left as-is.
- `npm run build` only bundles `index.html` + `wordplayer.html` (9 modules). All 10 custom games ship as raw unbundled source from `public/`, so a broken import inside a game passes CI and only fails in the browser.
- No automated tests. Serverless errors are now logged (priority 3), but there is still no client-side error reporting, so a browser-side crash in a game remains invisible unless the user reports it.

Recent_Changes:
- 2026-08-30 Replaced the inert `::root` dark-theme tokens in `base.css` with a `:root` holding `--font-sans` alone; the audit's literal fix was measured first and would have made text unreadable on the hub and wordplayer.
- 2026-08-30 Made CI a real gate: ESLint globs repointed at the real tree (1207 errors to 0), `.prettierignore` added, 52 maintained files formatted with `public/games/**` behind a ratchet, CI on `npm ci`; `npm run check` green.
- 2026-08-30 Minimal serverless observability: 5xx detail is logged as one-line JSON and redacted from responses, all 8 handlers wrapped in `withErrorHandling`, malformed bodies now yield 400 instead of 500.
- 2026-08-30 Added `vercel.json` security headers, an in-memory throttle on login and `/api/track`, and token-based admin auth (`api/admin/login.js` + `api/_lib/adminAuth.js`); the password is no longer stored in the browser.
- 2026-08-30 Closed the destructive Yatzy API surface: removed the unauthenticated bulk-purge endpoint, required seat tokens on delete and seat reclaim, bounded `gameState` size, escaped the winner banner.
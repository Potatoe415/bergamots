# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer fully migrated from Firebase to Vercel + Supabase (shared `multigames-db` project with `coinchapp`) and verified end-to-end in production. All info files (`docs/*`, `STATE.md`) audited and aligned with this reality; no remaining Firebase references outside historical decision/migration-note entries.
Current_Goal: Keep evolving the Bergamots game hub now that hosting is on Vercel and Yatzy is on Supabase.
Last_Action: Fixed two remaining Yatzy online-multiplayer sync races reported by the user (dice self-deselecting, turns/rolls seeming to happen on their own, host-side lag) after the 2026-08-16 fix wasn't enough: (1) `handleMatchStateChange`'s "keep local state authoritative while my write is in flight" guard in `public/games/yatsy/app.js` required `isLocalPlayersTurn()`, but `commitScoreSelection` flips `currentPlayerIndex` locally *before* sending the write, so the guard was bypassed exactly when a scoring commit was in flight — now it just checks `pendingRemoteSyncCount > 0`; (2) `refetch()` in `matchmaking.js` is triggered from 4 independent sources (poll timer, tab visibility, Postgres INSERT, realtime "tick") with no ordering guarantee, so a slow stale HTTP response could land after a fresher one and silently roll the UI back — the already-existing `yatzy_games.version` column is now returned by `GET /api/yatsy/games/{code}` and the `resume` endpoint, and the client discards any response whose version regresses. Verified via `npm run build` + `prettier --check` (pre-existing formatting warnings on touched files, unrelated to this change, confirmed via `git stash`).
Next_Actions:
- User to manually test the 1v1 online flow again (host + joiner tabs) to confirm the dice-deselect/auto-reroll glitches are gone; report back if anything similar still recurs.
- User to delete/decommission the Firebase project (Hosting + Realtime Database) whenever ready — confirmed safe, no other game depends on it.
- Be aware Sync-Push/Pull use mtime-based conflict resolution, not real git merge — double-check important changes weren't silently overwritten after each sync.
- `GitHistory.txt` PULL entries only reach other machines once that computer next runs a Push — inherent limitation of the file-based sync approach (no server), flagged to user.
- Pick the first real item for `docs/BACKLOG.md` Now.
- Confirm with user whether to keep or delete `refactor.py` (one-off, already-applied migration script left at repo root).
- Decide on automated testing / error-handling conventions (see `docs/TECH.md` Open_Questions).
- Pre-existing, unrelated bug noticed: `eslint.config.mjs`'s browser-globals block (`files: ["apps/**/*.js", "shared/**/*.js"]`) doesn't match any real folder (games live under `public/games/**`, shared code under `public/shared/**`), so `npm run lint` reports hundreds of false-positive `no-undef` errors across the whole repo. Left untouched (out of scope for this migration); flagged for a future fix.

Open_Questions:
- Project_Name: Bergamots (confirmed from README/package.json)
- Target_Users: Confirmed in `docs/PRODUCT.md` (party-game groups, remote Yatzy players)
- Stack: Vanilla JS + Vite; Yatzy backed by Supabase Postgres via `api/yatsy/games/*` (see `docs/DATA_MODEL.md`, `docs/TECH.md`, both updated and confirmed).
- Deployment_Target: Vercel (confirmed live, `bergamots` project, Git-integration auto-deploy on push to `main`).

Recent_Changes:
- 2026-08-17 Fixed Yatzy die-deselect/self-reroll glitches: removed `isLocalPlayersTurn()` from the pending-write guard in `app.js` (bypassed right after scoring, since currentPlayerIndex flips locally before the write is sent) and added `version`-based staleness filtering in `matchmaking.js`/`api/yatsy/games/[code].js`/`resume.js` so out-of-order refetch responses can no longer roll the UI back.
- 2026-08-16 Hub banner is now responsive: `<picture>`/`<source>` in `index.html` swaps to a dedicated mobile crop (`banner-games-hub-mobile.jpg`) under 600px, desktop keeps `banner-games-hub.jpg`.
- 2026-08-16 Locked in the final hub banner ("Game on!" board-game scene, user-supplied file) after it kept changing mid-session via an external sync tool; removed the stale backup copy.
- 2026-08-16 Re-grouped hub categories per user request (`cartesdes`/`mots`/`autres` re-split; see Last_Action) and added `temp-design/` to `.gitignore`.
- 2026-08-16 Redesigned the hub (`index.html`/`hub.css`/`hub.js`) from the `temp-design/` mockup: language flag switcher, category tabs, new tile look, new banner; added `category` to `public/hub-config.json` and `docs/DATA_MODEL.md`.

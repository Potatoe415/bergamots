# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer fully migrated from Firebase to Vercel + Supabase (shared `multigames-db` project with `coinchapp`) and verified end-to-end in production. All info files (`docs/*`, `STATE.md`) audited and aligned with this reality; no remaining Firebase references outside historical decision/migration-note entries.
Current_Goal: Keep evolving the Bergamots game hub now that hosting is on Vercel and Yatzy is on Supabase.
Last_Action: Applied the `temp-design/` mockup redesign to the real hub: rewrote `index.html`/`hub.css`/`hub.js` (FR/EN/ES language flag switcher persisted in `localStorage`, Cartes/Mots/Autres category tabs, portrait tile cards with gradient-overlay titles, Baloo 2 + Quicksand fonts), added a `category` field to all 14 entries in `public/hub-config.json`, and replaced `public/assets/banner-games-hub.jpg` with the new banner from `temp-design/assets/banner-bergamots-2.jpg`. Verified with `npm run build` and a browser check (all 3 tabs filter correctly, flag menu opens/closes).
Next_Actions:
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
- 2026-08-16 Redesigned the hub (`index.html`/`hub.css`/`hub.js`) from the `temp-design/` mockup: language flag switcher, Cartes/Mots/Autres category tabs, new tile look, new banner; added `category` to `public/hub-config.json` and `docs/DATA_MODEL.md`.
- 2026-08-16 Fixed Yatzy multiplayer die-selection race: serialized outgoing `updateGameState` writes (chained, no longer parallel) and made `handleMatchStateChange` skip remote hydration while a local write is pending during the local player's own turn, so a fast click no longer gets silently reverted by a stale refetch.
- 2026-08-16 Added `Sync-Log.ps1` + `GitHistory.txt` logging (date/time, PUSH or PULL, computer name, Windows username) to `Sync-Push.ps1`/`Sync-Pull.ps1`, so the user can identify which machine/login did the last sync.
- 2026-08-16 Reintroduced Sync-Push/Pull tooling (user's explicit choice, reversing the 2026-08-15 retirement) — see `docs/DECISIONS.md`.
- 2026-08-16 Docs audit: fixed the last stale Firebase reference in `docs/TECH.md` (Deployment), added the shared-`multigames-db` detail to `docs/TECH.md` Database, logged 2 new decisions in `docs/DECISIONS.md` (shared Supabase project reuse; Firebase decommission confirmation).

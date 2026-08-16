# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer + hub hosting migrated from Firebase to Vercel + Supabase (code done; Supabase project creation, migration run, and Vercel project/env setup are manual follow-ups — see Next_Actions).
Current_Goal: Finish the Firebase to Vercel + Supabase migration (provision Supabase + Vercel, then verify end-to-end) and keep evolving the Bergamots game hub.
Last_Action: Implemented the Yatzy Firebase to Vercel+Supabase migration: added `api/yatsy/games/*` serverless functions + `supabase/migrations/0001_yatzy.sql`, rewrote `public/games/yatsy/matchmaking.js` against the new API (same public interface, no `app.js`/`robot.js` changes), replaced `firebase-config.js` with `supabase-config.js`, removed `firebase.json`/`.firebaserc`, updated `docs/RUNBOOK.md`/`docs/DATA_MODEL.md`, logged the decision in `docs/DECISIONS.md`.
Next_Actions:
- Create the Supabase project, run `supabase/migrations/0001_yatzy.sql`, fill in real values in `public/games/yatsy/supabase-config.js`.
- Create/link the Vercel project for this repo, set `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env vars, connect the production domain, retire the Firebase Hosting site.
- Confirm with user whether to also decommission the Firebase project itself (Realtime Database), not just stop using it.
- Confirm with user on the exact `docs/TECH.md` diff for this migration (pending approval, per file ownership rules).
- Pick the first real item for `docs/BACKLOG.md` Now.
- Confirm with user whether to keep or delete `refactor.py` (one-off, already-applied migration script left at repo root).
- Decide on automated testing / error-handling conventions (see `docs/TECH.md` Open_Questions).
- Pre-existing, unrelated bug noticed: `eslint.config.mjs`'s browser-globals block (`files: ["apps/**/*.js", "shared/**/*.js"]`) doesn't match any real folder (games live under `public/games/**`, shared code under `public/shared/**`), so `npm run lint` reports hundreds of false-positive `no-undef` errors across the whole repo. Left untouched (out of scope for this migration); flagged for a future fix.

Open_Questions:
- Project_Name: Bergamots (confirmed from README/package.json)
- Target_Users: Confirmed in `docs/PRODUCT.md` (party-game groups, remote Yatzy players)
- Stack: Vanilla JS + Vite; Yatzy now backed by Supabase Postgres via `api/yatsy/games/*` (see `docs/DATA_MODEL.md`). `docs/TECH.md` Stack_Backend/Database/Hosting/Security sections still describe the old Firebase setup, pending user-approved update.
- Deployment_Target: Moving to Vercel (whole hub); Firebase Hosting config removed from the repo. Actual Vercel project/domain setup still to be done manually.

Recent_Changes:
- 2026-08-15 Migration: Yatzy multiplayer moved from Firebase Realtime Database to Supabase Postgres (`api/yatsy/games/*`, `supabase/migrations/0001_yatzy.sql`); hub hosting target changed from Firebase Hosting to Vercel (`firebase.json`/`.firebaserc` removed, `.env.example` added).
- 2026-08-15 Bootstrap: created `AGENTS.md` context architecture, populated `docs/*` from existing legacy docs.
- 2026-08-15 Cleanup: deleted `Sync-Push.ps1`, `Sync-Pull.ps1`, `Sync-Push.bat`, `Sync-Pull.bat`, `SYNC-HISTORY.md` (old cross-machine sync-flow tooling).
- 2026-08-15 Cleanup: deleted `spectre_fonctionnel.md`, `spectre_technique.md`, `docs/ai/cursor.md` (content migrated, now superseded).

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer fully migrated from Firebase to Vercel + Supabase (shared `multigames-db` project with `coinchapp`) and verified end-to-end in production. All info files (`docs/*`, `STATE.md`) audited and aligned with this reality; no remaining Firebase references outside historical decision/migration-note entries.
Current_Goal: Keep evolving the Bergamots game hub now that hosting is on Vercel and Yatzy is on Supabase.
Last_Action: Full docs audit: fixed the last stale line in `docs/TECH.md` (Deployment described Firebase Hosting as manual; now describes Vercel's Git-integration auto-deploy) and added the `multigames-db` shared-project detail (both user-approved); logged two decisions in `docs/DECISIONS.md` (reusing coinchapp's Supabase project instead of a dedicated one; confirming Firebase is safe to decommission).
Next_Actions:
- User to delete/decommission the Firebase project (Hosting + Realtime Database) whenever ready — confirmed safe, no other game depends on it.
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
- 2026-08-16 Docs audit: fixed the last stale Firebase reference in `docs/TECH.md` (Deployment), added the shared-`multigames-db` detail to `docs/TECH.md` Database, logged 2 new decisions in `docs/DECISIONS.md` (shared Supabase project reuse; Firebase decommission confirmation).
- 2026-08-16 Verification: confirmed Firebase is unused outside Yatzy (repo-wide search); updated `docs/PRODUCT.md`/`docs/BACKLOG.md` accordingly; user cleared to delete their Firebase project.
- 2026-08-16 Deploy: linked repo to existing Vercel `bergamots` project, set `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env vars, committed+pushed the migration, verified create/join/delete against production Supabase (`multigames-db`, shared with coinchapp).
- 2026-08-15 Migration: Yatzy multiplayer moved from Firebase Realtime Database to Supabase Postgres (`api/yatsy/games/*`, `supabase/migrations/0001_yatzy.sql`); hub hosting target changed from Firebase Hosting to Vercel (`firebase.json`/`.firebaserc` removed, `.env.example` added).
- 2026-08-15 Bootstrap: created `AGENTS.md` context architecture, populated `docs/*` from existing legacy docs.

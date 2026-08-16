# DECISIONS

Status: Append-only. Never edit past entries.

---

## Decision threshold

Log a decision if any of the following is true:
- Locks in a technology, library, or vendor.
- Changes the data model, persistence structure, ownership rules, or access model.
- Changes ownership or structure of a file or module.
- Cannot be reversed in under 30 minutes.
- Contradicts a previous entry in this file.

If unsure: add an Open_Question to `STATE.md`, not a decision entry.

---

## Template

## YYYY-MM-DD — Title

Decision: One sentence.
Context: Why this came up.
Rationale: Why this option over others.
Consequences: What this locks in or rules out.
Alternatives_Rejected: What was considered and why it lost.

---

## 2026-08-15 — Adopt agent-agnostic context architecture, retire sync-flow tooling

Decision: Adopted the `AGENTS.md`-centric context architecture (canonical protocol + thin routers `CLAUDE.md`/`GEMINI.md`/`.cursor/rules/000-router.mdc` + `STATE.md` + `docs/*`) for this existing project, and removed the manual multi-machine sync tooling (`Sync-Push.ps1`, `Sync-Pull.ps1`, their `.bat` launchers, and `SYNC-HISTORY.md`).
Context: The repo previously relied on ad-hoc reverse-engineering notes (`spectre_fonctionnel.md`, `spectre_technique.md`), a standalone Cursor rules file (`docs/ai/cursor.md`), and hand-rolled PowerShell scripts that pushed/pulled the repo across machines and logged a "files sent/received" counter to `SYNC-HISTORY.md`. Git plus a normal remote already provides sync; the counter file added noise without value.
Rationale: A single canonical protocol file with conditional loading (per `AGENTS.md` Startup Protocol) prevents drift across AI tools and keeps token usage low. Real product/tech knowledge from the old spec files was migrated into `docs/PRODUCT.md` and `docs/TECH.md` instead of being left as `TBD`, since this is an existing, non-empty project.
Consequences: `docs/PRODUCT.md` and `docs/TECH.md` are now frozen until the user authorises changes. Anyone syncing machines must use plain `git pull` / `git push` going forward; there is no more automated "last write wins by file timestamp" merge or sync log.
Alternatives_Rejected: Keeping the sync scripts alongside the new docs — rejected because the user explicitly asked to erase the old flow-measuring files, and duplicate sync mechanisms (git + custom scripts) invite drift. Keeping `spectre_*.md` as-is alongside `docs/PRODUCT.md`/`docs/TECH.md` — rejected to avoid two sources of truth.

---

## 2026-08-15 — Migrate Yatzy multiplayer + hub hosting from Firebase to Vercel + Supabase

Decision: Moved the whole hub from Firebase Hosting to Vercel (static build + new `api/yatsy/games/*` serverless functions in the same project), and replaced Yatzy's Firebase Realtime Database matchmaking with Supabase Postgres (`supabase/migrations/0001_yatzy.sql`), reusing the `coinchapp` project's security pattern (service-role key confined to server code, RLS blocking all direct client access to game rows).
Context: User asked to reuse the same Vercel+Supabase system as `dev-projects/coinchapp` for Yatzy's online multiplayer instead of Firebase.
Rationale: `coinchapp`'s security boundary ("browser never touches Postgres for game rows") requires a server-side authority; Bergamots had no backend, so Vercel Serverless Functions under `api/` take on that role while the existing vanilla-JS Yatzy frontend and its room-code + seat-token capability model are kept unchanged (no React/Next.js rewrite, no new auth system — YAGNI). Since the whole hub previously deployed as one static site, moving hosting entirely to Vercel avoids splitting the hub across two hosting providers.
Consequences: `firebase.json`/`.firebaserc` removed; Firebase Hosting and the Firebase Realtime Database are no longer used by this repo (the Firebase project itself is not deleted — that is a separate manual decision, flagged to the user). New required env vars on Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. A new Supabase project must be created and the migration run before Yatzy online multiplayer works again.
Alternatives_Rejected: Rewriting Yatzy in Next.js/React to mirror `coinchapp`'s Server Actions exactly — rejected to avoid introducing a UI framework for one game in an otherwise framework-free hub. Adopting Supabase anonymous auth (`user_id`-based seats) like `coinchapp` — rejected, since the existing room-code + resume-token capability model already solves Yatzy's 2-seat, no-accounts use case without an auth system. Splitting hosting (hub on Firebase Hosting, Yatzy API on a separate Vercel project) — rejected in favor of one hosting provider for the whole hub.

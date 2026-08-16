# BACKLOG

Status: Living document. Always reflects current state.

---

## Now
- [ ] TBD — add next task here.

## Next
- [ ] Decide whether to add automated tests for `scoring.js` (Yatzy) and `shared/js/engine.js`.
- [ ] Decide whether to formalize a shared error-handling/logging convention (see `docs/TECH.md` Open_Questions).

## Later
- [ ] Deduplicate the rules-modal loading logic repeated across several games (`docs/TECH.md` Open_Questions).

## Blocked
- [ ] TBD

## Done
- [x] 2026-08-15 — Bootstrapped agent context architecture (`AGENTS.md` + `docs/`), migrated legacy specs, removed old sync-flow scripts.
- [x] 2026-08-16 — Migrated Yatzy multiplayer from Firebase Realtime Database to Supabase Postgres (shared `multigames-db` project) via new `api/yatsy/games/*` Vercel functions; moved hub hosting from Firebase Hosting to Vercel (auto-deploy via Git integration, superseding the old "wire Firebase Hosting into CI" item). Verified end-to-end in production.

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend migrated from Railway/Socket.IO to Vercel Serverless Functions + Supabase (reusing coinchapp's Supabase project/tables). Env vars are set on Vercel; the "create room" 500 is fixed and confirmed working in production via a direct `/api/join` call. Still needs a real two-browser-tab play-test.
Current_Goal: Manually play-test the online flow end-to-end in the browser (two tabs), then resume normal feature work.
Last_Action: Root-caused the "create room" 500 via `vercel logs` (the Cursor↔Vercel MCP integration turned out to be scoped to the `coinchapp` project only — unblocked by running `vercel login` locally instead): `shared/package.json`'s `main` pointed at raw `./src/index.ts`, which Vercel's Node function runtime cannot `require()` at deploy time (unlike Vite, which transpiles it for the client, masking the issue locally). Fixed by compiling `shared` to CommonJS (`shared/tsconfig.json` + a `build` script; `main`/`types` now point to `dist/`), wired into `vercel.json`'s `buildCommand` and the root `dev`/`dev:api`/`install:all` scripts. Verified: `shared` build, client build, `api` type-check, and `shared` unit tests all pass locally against the latest synced tree (which also picked up a separate session's connecting-screen UI + debug logging work).
Next_Actions:
- Manually play-test online mode with two browser tabs: create room, join by code, play a few cards, reload one tab (session resume), test seat takeover after 30s idle.
- Re-play-test local/vs-bot modes (unaffected by this migration, but not re-verified since).
- If any other `/api/*` 500s show up, use `vercel logs <deployment-url>` (CLI is now logged in locally; `vercel ls` in `tranquil/` lists deployments) rather than the Cursor↔Vercel MCP, which is scoped to the `coinchapp` project only.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Recent_Changes:
- 2026-08-03 Bugfix: "create room" 500 — `shared` package now compiled to CommonJS (`shared/dist`) instead of shipping raw `.ts` as `main`, which Vercel's Node function runtime couldn't `require()`. Build wired into `vercel.json` + root dev scripts.
- 2026-08-03 Debug: Tagged app/server/db console logging for every step of connect/join/resume (client/src/lib/log.ts, api/_lib/log.ts).
- 2026-08-03 UI: Multi-step "connecting" progress stepper for online create/join/resume (ConnectingScreen.tsx + useOnlineGame connectionKind/connectionStep).
- 2026-08-03 Migration: Railway/Socket.IO → Vercel Serverless Functions + Supabase (shared project with coinchapp, `game_type='tranquillity'`, no new SQL migration needed). See docs/DECISIONS.md for rationale/trade-offs.

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend migrated from Railway/Socket.IO to Vercel Serverless Functions + Supabase (reusing coinchapp's Supabase project/tables). Code complete and type-checked; not yet deployed/play-tested on the new backend — needs real Supabase env vars and a manual two-tab test.
Current_Goal: Get the Supabase/Vercel backend live and verified (env vars filled in, deployed, two-browser play-test), then resume normal feature work.
Last_Action: Implemented the full migration: `api/` serverless functions (join/get-view/play-card/discard-two/contribute-start-discard + `_lib` for auth/repo/supabaseAdmin), replaced `client/src/socket.ts` with `client/src/lib/` (supabase, api, useOnlineGame realtime hook), rewired `App.tsx`'s online wiring, removed `server/` + `railway.json` + socket.io(-client), updated root/client `package.json`, and updated STATE/TECH/DATA_MODEL/DECISIONS/RUNBOOK/BACKLOG.
Next_Actions:
- Fill `.env.local` and `client/.env.local` with the real Supabase project values (same project as coinchapp) — see `docs/RUNBOOK.md`.
- Add the same env vars to the Vercel project dashboard (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
- Manually play-test online mode with two browser tabs: create room, join by code, play a few cards, reload one tab (session resume), test seat takeover after 30s idle.
- Deploy to Vercel and confirm `/api/*` isn't shadowed by the SPA rewrite in `vercel.json`.
- Re-play-test local/vs-bot modes (unaffected by this migration, but not re-verified since).

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Recent_Changes:
- 2026-08-03 Migration: Railway/Socket.IO → Vercel Serverless Functions + Supabase (shared project with coinchapp, `game_type='tranquillity'`, no new SQL migration needed). See docs/DECISIONS.md for rationale/trade-offs.
- 2026-06-06 Bugfix: TS2339 in GameOver.tsx — destructure `settings` from useSettings(), then `soundOnMyTurn` from settings.
- 2026-06-06 Feature: Win/lose sounds + entrance animation on GameOver screen (sounds.ts + GameOver.tsx).
- 2026-06-06 UI: Room code now shown in 'waiting for second player' status bar (GameBoard.tsx + i18n.tsx).
- 2026-06-06 Bugfix: monster card animation — setOpponentPlay fires immediately on current player's monster play (GameBoard.tsx); 🐙 emoji enlarged to text-3xl + fade-in-scale + red bg (Grid.tsx).

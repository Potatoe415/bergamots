# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend on Vercel + Supabase. Create-room works in production. End-to-end two-tab play-test still pending.
Current_Goal: Delay the game-over overlay so the last board state stays visible.
Last_Action: GameOver waits 2s after win/loss so the last tile (or losing board) can be seen; last grid change is highlighted even when the turn never flips.
Next_Actions:
- Manually play-test online mode with two browser tabs: create room, join by code/link, play a few cards, reload, seat takeover.
- Re-play-test local/vs-bot modes on a real iPhone Safari if possible.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Recent_Changes:
- 2026-09-05 UX: 2s delay before GameOver overlay; highlight last grid change on game end.
- 2026-09-05 Bugfix: iOS Safari hand clipped by toolbar — sync `--app-height` to visualViewport, pin GameBoard, shrink hand grid items.
- 2026-09-05 UX: Share-game-link button on the online create-room stepper (native share or clipboard fallback).
- 2026-08-03 UX: Optimistic local move application in online mode — the card lands on the grid on click instead of after the API round-trip.
- 2026-08-03 Bugfix: "create room" 500 — `shared` package now compiled to CommonJS (`shared/dist`) instead of shipping raw `.ts` as `main`.

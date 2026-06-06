# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fully deployed — frontend on Vercel, backend on Railway, online multiplayer live.
Current_Goal: Playable 2-player Tranquillity card game in browser (local, online, and vs bot), with complete EN/FR UI coverage.
Last_Action: Fixed TS2339 build error in GameOver.tsx — useSettings() returns { settings, update }; destructure settings first, then soundOnMyTurn from settings.
Next_Actions:
- Play-test monster card animation in all three modes (local, vs bot, online).
- Play-test start_discard turn order in all three modes.
- Deploy to Vercel/Railway and regression-test online multiplayer.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?

Recent_Changes:
- 2026-06-06 Bugfix: TS2339 in GameOver.tsx — destructure `settings` from useSettings(), then `soundOnMyTurn` from settings.
- 2026-06-06 Feature: Win/lose sounds + entrance animation on GameOver screen (sounds.ts + GameOver.tsx).
- 2026-06-06 UI: Room code now shown in 'waiting for second player' status bar (GameBoard.tsx + i18n.tsx).
- 2026-06-06 Bugfix: monster card animation — setOpponentPlay fires immediately on current player's monster play (GameBoard.tsx); 🐙 emoji enlarged to text-3xl + fade-in-scale + red bg (Grid.tsx).
- 2026-06-06 Bugfix: start_discard draw — changed drawUp(p,7) to drawExactly(p,2); Start player now gets 6 cards (not 7), other gets 7, per 2-player rules (gameEngine.ts).
- 2026-06-06 UI: Added v0.8 version label to lobby bottom bar (Lobby.tsx).

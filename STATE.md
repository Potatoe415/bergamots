# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fully deployed — frontend on Vercel, backend on Railway, online multiplayer live.
Current_Goal: Playable 2-player Tranquillity card game in browser (local, online, and vs bot), with complete EN/FR UI coverage.
Last_Action: Fixed turn-order bug — after start_discard completes the engine now hands the turn to the OTHER player (not the Start-card player again). Also fixed UI: island-card placement now shows the card semi-transparently on the grid while the discard-cost bar is active, so discard always feels post-play.
Next_Actions:
- Play-test start_discard turn order in all three modes (local, vs bot, online).
- Play-test island card placement with discard cost — verify card appears on grid before discard prompt.
- Deploy to Vercel/Railway and regression-test online multiplayer.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?

Recent_Changes:
- 2026-06-06 Bugfix: turn order — applyContributeStartDiscard nextPlayerIndex flipped to other player when remaining=0 (gameEngine.ts:556).
- 2026-06-06 Bugfix: Grid now shows pending island card semi-transparently while discard-cost bar is active (Grid.tsx + GameBoard.tsx).
- 2026-06-06 Bugfix: Bot end-game — bot defers finish card to human when human holds one; prevents silent auto-win.
- 2026-06-06 Bugfix: start_discard hand size — engine trims excess after remaining=0, enforces per-player min contribution; bot and UI updated to match.
- 2026-06-04 i18n: Lobby reset/settings/rules, difficulty picker, start/finish indicators, and turn/status prompts now render through EN/FR translations.
- 2026-06-04 Feature: Play vs Bot — co-op heuristic bot (chooseBotAction) + lobby button + setTimeout auto-play in local mode; human always views as player 0.

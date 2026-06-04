# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fully deployed — frontend on Vercel, backend on Railway, online multiplayer live.
Current_Goal: Playable 2-player Tranquillity card game in browser (local, online, and vs bot).
Last_Action: Strengthened the co-op bot — feasibility analysis (shared/src/gridFeasibility.ts) so it never creates unfillable gaps, prefers roomy placements, and uses Sea Monsters to repair broken grids. Self-play-tuned; bot-vs-bot win rate up ~3-4×. Build + 51 tests green.
Next_Actions:
- Play-test "Play vs Bot" mode (varied difficulties) for feel and stalls.
- Play-test online multiplayer end-to-end at tranquil-woad.vercel.app.
- Play-test pass-and-play mode.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?

Recent_Changes:
- 2026-06-04 Bot: feasibility-aware play (gridFeasibility.ts) — avoids unfillable gaps, roomy placement, Sea-Monster grid repair; self-play-tuned, win rate up ~3-4×.
- 2026-06-04 UX: Lobby footer — "Rules" link button next to Settings opens the rules PDF in a new tab.
- 2026-06-04 Feature: Play vs Bot — co-op heuristic bot (chooseBotAction) + lobby button + setTimeout auto-play in local mode; human always views as player 0.
- 2026-06-04 Bugfix: Grid mobile overflow — container query units min(100cqw,100cqh) make grid always square and within viewport.
- 2026-06-04 UX: LanguageSwitcher — shows current lang code; click opens pop-up language picker.
- 2026-06-04 UX: Room code moved from GameBoard header → settings pop-up (online games only).

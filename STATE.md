# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fully deployed — frontend on Vercel, backend on Railway, online multiplayer live.
Current_Goal: Playable 2-player Tranquillity card game in browser (local, online, and vs bot), with complete EN/FR UI coverage.
Last_Action: Fixed missing French translations for lobby footer buttons, difficulty picker, start/finish indicators, and in-game turn/status prompts. Client build green.
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
- 2026-06-04 i18n: Lobby reset/settings/rules, difficulty picker, start/finish indicators, and turn/status prompts now render through EN/FR translations.
- 2026-06-04 Bot: feasibility-aware play (gridFeasibility.ts) — avoids unfillable gaps, roomy placement, Sea-Monster grid repair; self-play-tuned, win rate up ~3-4×.
- 2026-06-04 UX: Lobby footer — "Rules" link button next to Settings opens the rules PDF in a new tab.
- 2026-06-04 Feature: Play vs Bot — co-op heuristic bot (chooseBotAction) + lobby button + setTimeout auto-play in local mode; human always views as player 0.
- 2026-06-04 Bugfix: Grid mobile overflow — container query units min(100cqw,100cqh) make grid always square and within viewport.

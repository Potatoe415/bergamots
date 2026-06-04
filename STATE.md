# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fully deployed — frontend on Vercel, backend on Railway, online multiplayer live.
Current_Goal: Playable 2-player Tranquillity card game in browser.
Last_Action: LanguageSwitcher redesigned — shows current lang code only; click opens a pop-up to select language.
Next_Actions:
- Play-test online multiplayer end-to-end at tranquil-woad.vercel.app.
- Play-test pass-and-play mode.

Open_Questions:
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?

Recent_Changes:
- 2026-06-04 UX: LanguageSwitcher — shows current lang code; click opens pop-up language picker.
- 2026-06-04 UX: Room code moved from GameBoard header → settings pop-up (online games only).
- 2026-06-04 UX: "Restart game" button in settings pop-up (GameBoard) — calls onRematch to start fresh with same players.
- 2026-06-04 Bugfix: start_discard card selection — phase-change effect clears stale state; isMyTurnToContribute check prioritised over pendingPlay in handleCardClick.
- 2026-06-04 Bugfix: URL ?room= now takes priority over saved session if rooms differ; tranquillity_room saved in localStorage.
- 2026-06-04 Server: 48h room TTL — lastActivityAt tracked per room, purgeExpiredRooms runs every hour.
- 2026-06-04 UX: settings gear button (next to reset) — pop-up with sound-on-turn toggle; persisted in localStorage.
- 2026-06-04 UX: reset button (trash icon) on lobby splash — clears all browser storage/cookies/caches and reloads.
- 2026-06-04 Layout: game-footer always visible — game-canvas flex-1 all viewports, Grid height-driven + max-w-full.
- 2026-06-04 UX: opponent-play preview fixed for local mode — pendingOpponentPlay in LocalState bridges the pass-and-play remount.
- 2026-06-03 Layout: desktop grid spacer hidden on md+ — board now fills available height.
- 2026-06-03 Sea Monsters: Lobby difficulty picker, GameBoard banner, TypeScript clean.
- 2026-06-03 Deployment: frontend deployed to Vercel (tranquil-woad.vercel.app); vercel.json added.
- 2026-06-03 Grid: board wrapped in aspect-square max-h-full so cells are always perfectly square.
- 2026-06-03 Deploy: backend on Railway, VITE_SERVER_URL set on Vercel, room codes → 3 letters.
- 2026-06-03 Bugfix: isValidPlacement now enforces positional bounds (value > pos; value <= 45+pos); 46 tests pass.
- 2026-06-03 Lobby: Cancel button in waiting-for-partner state — disconnects socket, returns to main screen.
- 2026-06-03 Rooms: open entry by code — kick guest (player 1) or disconnected player; resume mid-game on replacement.

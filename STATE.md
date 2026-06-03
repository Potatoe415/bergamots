# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fully deployed — frontend on Vercel, backend on Railway, online multiplayer live.
Current_Goal: Playable 2-player Tranquillity card game in browser.
Last_Action: URL ?room=ABC param — synced with room code; auto-rejoin on refresh via session token (primary) or URL+stored name (fallback).
Next_Actions:
- Play-test online multiplayer end-to-end at tranquil-woad.vercel.app.
- Play-test pass-and-play mode.

Open_Questions:
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?

Recent_Changes:
- 2026-06-03 Sea Monsters: Lobby difficulty picker, GameBoard banner, TypeScript clean.
- 2026-06-03 Session persistence: localStorage restore on refresh (local + online); server reconnect fix.
- 2026-06-03 Deployment: frontend deployed to Vercel (tranquil-woad.vercel.app); vercel.json added.
- 2026-06-03 Grid: board wrapped in aspect-square max-h-full so cells are always perfectly square.
- 2026-06-03 Deploy: backend on Railway, VITE_SERVER_URL set on Vercel, room codes → 3 letters.
- 2026-06-03 Bugfix: isValidPlacement now enforces positional bounds (value > pos; value <= 45+pos); 46 tests pass.
- 2026-06-03 Lobby: Cancel button in waiting-for-partner state — disconnects socket, returns to main screen.
- 2026-06-03 Rooms: open entry by code — kick guest (player 1) or disconnected player; resume mid-game on replacement.
- 2026-06-03 URL: ?room=ABC param synced with room; auto-rejoin on refresh via token or URL+name fallback.

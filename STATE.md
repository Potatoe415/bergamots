# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fully deployed — frontend on Vercel, backend on Railway, online multiplayer live.
Current_Goal: Playable 2-player Tranquillity card game in browser.
Last_Action: Full deployment — VITE_SERVER_URL set on Vercel, frontend redeployed, room codes changed to 3 letters.
Next_Actions:
- Play-test online multiplayer end-to-end at tranquil-woad.vercel.app.
- Play-test pass-and-play mode.

Open_Questions:
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?

Recent_Changes:
- 2026-06-03 Phase 1–4: full game (engine + server + client), 32 tests.
- 2026-06-03 Phase 5: EN/FR multilanguage.
- 2026-06-03 Card sprites: cards-strip.jpg (11 frames), square cards.
- 2026-06-03 Sea Monsters: CardType monster, finish_pending phase, 9 new tests (41 total).
- 2026-06-03 Sea Monsters: Lobby difficulty picker, GameBoard banner, TypeScript clean.
- 2026-06-03 Mobile: grille pleine largeur (grid-cols-6 + aspect-square, suppression w-14 h-14 fixe).
- 2026-06-03 Bugfix: discard-two card selection broken — Hand forceSelectable + additionalSelectedIds.
- 2026-06-03 Mobile: hand cards single-row grid, full-width, auto-sized per card count.
- 2026-06-03 Session persistence: localStorage restore on refresh (local + online); server reconnect fix.
- 2026-06-03 Deployment: frontend deployed to Vercel (tranquil-woad.vercel.app); vercel.json added.
- 2026-06-03 Lobby: dashboard.jpg used as splash screen background with black/50 overlay.
- 2026-06-03 Grid: board wrapped in aspect-square max-h-full so cells are always perfectly square.
- 2026-06-03 Deploy: backend on Railway, VITE_SERVER_URL set on Vercel, room codes → 3 letters.

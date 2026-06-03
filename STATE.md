# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Core game + Sea Monsters expansion + card sprites implemented. Frontend live on Vercel.
Current_Goal: Playable 2-player Tranquillity card game in browser.
Last_Action: Mobile layout — grid fills height (grid-rows-6 h-full), removes aspect-square overflow, hand always visible
Next_Actions:
- Deploy Socket.io backend (server/) to Railway/Render/Fly.io for online multiplayer.
- Set VITE_SERVER_URL env var on Vercel to point to deployed backend.
- Play-test refresh mid-local-game (should restore board).

Open_Questions:
- Deployment_Target (backend): Railway / Render / Fly.io — TBD
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
- 2026-06-03 Mobile: grid uses h-full+grid-rows-6 (no aspect-square), hand always anchored at bottom.

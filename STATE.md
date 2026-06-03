# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Core game + Sea Monsters expansion + card sprites implemented.
Current_Goal: Playable 2-player Tranquillity card game in browser.
Last_Action: Grid responsive — remplacé w-14 h-14 fixe par grid-cols-6 + aspect-square, pleine largeur sur mobile.
Next_Actions:
- Run `npm install && npm run dev` from repo root to launch.
- Play-test Sea Monsters (select Easy/Medium/Hard in lobby difficulty picker).
- Play-test online mode (two browser tabs / devices).

Open_Questions:
- Deployment_Target: TBD
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?

Recent_Changes:
- 2026-06-03 Phase 1–4: full game (engine + server + client), 32 tests.
- 2026-06-03 Phase 5: EN/FR multilanguage.
- 2026-06-03 Card sprites: cards-strip.jpg (11 frames), square cards.
- 2026-06-03 Sea Monsters: CardType monster, finish_pending phase, 9 new tests (41 total).
- 2026-06-03 Sea Monsters: Lobby difficulty picker, GameBoard banner, TypeScript clean.
- 2026-06-03 Mobile: grille pleine largeur (grid-cols-6 + aspect-square, suppression w-14 h-14 fixe).

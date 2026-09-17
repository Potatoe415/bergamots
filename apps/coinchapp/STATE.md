# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Fluid table layout is in the working tree (needs commit+push). Same player topology on every screen: HUD overlay on top, oval/opponents in the remaining scene, hand fan at the bottom, safe-area insets on top and bottom (including la Bataille Corse).
Last_Action: Shipped full-viewport `TableShell` on all 4 games (cards `svmin` + 2:3, drop 460×720 column) and user-confirmed `docs/PRODUCT.md` tablet/desktop wording. Also includes Bataille Corse opponent reaction-time on slap wins (`PileWinEvent.reactionMsBySeat`) that the table already reads.
Next_Actions:
- Real 2-device test of la Bataille Corse online + ad-hoc - specifically the slap race with real network latency between two phones.
- Ask the user to sanity-check the "classic" Bataille Corse ruleset (double+sandwich only) once actually played.
- Investigate whether `lib/client/useBotRunner.ts`'s Coinche-brain-default bug also silently affects Président's online bots today.
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` - accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion.
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-17 `docs/PRODUCT.md`: tablette/desktop added (user-confirmed); mobile-first kept.
- 2026-09-17 All 4 tables: full-viewport `TableShell`, cards `svmin` + 2:3 ratio, drop 460×720 column. PRODUCT.md tablet/desktop (user-confirmed).
- 2026-09-16 la Bataille Corse: jokers reverted (52 cards, not 54) and bot speed reframed as a 4-level "Qualité des réflexes du bot" slider.
- 2026-09-16 la Bataille Corse: table redesign + configurable 32/54-card deck with jokers (later reverted) + dedicated splash art + taller home-grid tiles.
- 2026-09-16 la Bataille Corse: fourth game shipped (local/online/ad-hoc).
- 2026-09-15 Président: crown/confetti, exchange-panel fixes, forced-transfer visibility.

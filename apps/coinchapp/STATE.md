# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Fluid table layout is in the working tree (needs commit+push). Same player topology on every screen: HUD overlay on top, oval/opponents in the remaining scene, hand fan at the bottom, safe-area insets on top and bottom (including la Bataille Corse).
Last_Action: Added an `AGENTS.md` "shared base, differentiate on top" rule for the 4 card games, listing the modules that already are that base (`TableShell.tsx`, `TrickStage.tsx`'s `playedCardEnterStyle` for the played-card-to-center animation, `PlayingCard.tsx`, `GameHud`/`EmojiButton`/`ReactionBubble`/`SelfNameChip`/`PlayerBadge`/`gameTableHelpers`, `HandCardSlot.tsx`, and the 3 optimistic-play hooks) plus when a per-game difference (e.g. Président's select-then-confirm hand) is legitimate vs. duplication to avoid. Documentation only, no code changed this pass - confirmed the "card animates to center" example is already the shared `TrickStage.tsx` used by all 4 tables.
Next_Actions:
- Real 2-device test of la Bataille Corse online + ad-hoc - specifically the slap race with real network latency between two phones, and confirm the new instant-flip feedback feels right there too.
- Real 2-device test of Président online - confirm the instant combo-play feedback feels right with real network latency.
- Ask the user to sanity-check the "classic" Bataille Corse ruleset (double+sandwich only) once actually played.
- Investigate whether `lib/client/useBotRunner.ts`'s Coinche-brain-default bug also silently affects Président's online bots today.
- Commit and push the la Bataille Corse + Président instant-feedback fixes and the new `AGENTS.md` rule.
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` - accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion.
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-17 `AGENTS.md`: added a "shared base, differentiate on top" rule for the 4 card games (names the existing shared modules, incl. `TrickStage.tsx` for the played-card-to-center animation) alongside the instant-local-feel rule.
- 2026-09-17 Added `AGENTS.md` rule mandating instant local simulation for every card game's own-player action; audited all 4 tables against it and fixed the 2 real gaps found: la Bataille Corse (`useOptimisticFlip.ts`) and Président (`usePresidentOptimisticPlay.ts`, which had none at all). Coinche/Bouilla already complied.
- 2026-09-17 `docs/PRODUCT.md`: tablette/desktop added (user-confirmed); mobile-first kept.
- 2026-09-17 All 4 tables: full-viewport `TableShell`, cards `svmin` + 2:3 ratio, drop 460×720 column. PRODUCT.md tablet/desktop (user-confirmed).
- 2026-09-16 la Bataille Corse: jokers reverted (52 cards, not 54) and bot speed reframed as a 4-level "Qualité des réflexes du bot" slider.

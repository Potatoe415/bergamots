# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Fluid table layout is in the working tree (needs commit+push). Same player topology on every screen: HUD overlay on top, oval/opponents in the remaining scene, hand fan at the bottom, safe-area insets on top and bottom (including la Bataille Corse).
Last_Action: Added a 3rd fix on top of the pile-reveal/hold work below: during that 2s hold, the pile now actually animates - the whole gathered stack sweeps toward the winning seat (up = opponent's stock, down = the player's own) and shrinks away (`.bataillecorse-pile-fly` in `app/globals.css`, driven by `PileStack`'s new `fly` prop in `BataillecorseTable.tsx`), instead of just sitting still then vanishing. Also fixed 2 real UX bugs per user report: (1) a self-flip used to show a face-down placeholder card in the center pile while waiting on the network round trip (`pendingSelfFlip` in `PileStack`) - removed it; the pile now only ever shows the real, face-up card once the server confirms it, never a back. (2) a "double"/"sandwich" win used to clear the pile in the very same server update that reports the win, so the winning pattern's cards never got shown at all - added `useDisplayPile`, which freezes the pile at its pre-clear contents for 2s (`HOLD_PILE_MS`) after a `lastPileWin` event before releasing it back to the real (now empty) pile. Updated `useOptimisticFlip.ts`'s doc comment to match. Typecheck + lint clean; not yet committed/pushed, no real-device retest yet.
Next_Actions:
- Real-device test (2 phones, actual network) of la Bataille Corse online + ad-hoc: confirm a self-flip's card now appears directly face-up with no back-card flash, a double/sandwich win's cards stay visible and visibly fly into the winner's stock (~1.3s sweep inside the 2s hold), and check the sweep direction/distance actually reads well on a real phone screen (tuned by eye in code, `PILE_FLY_DISTANCE_PX` = 220).
- Real 2-device test of la Bataille Corse online + ad-hoc - specifically the slap race with real network latency between two phones.
- Real 2-device test of Président online - confirm the instant combo-play feedback feels right with real network latency.
- Ask the user to sanity-check the "classic" Bataille Corse ruleset (double+sandwich only) once actually played.
- Investigate whether `lib/client/useBotRunner.ts`'s Coinche-brain-default bug also silently affects Président's online bots today.
- Ask the user whether the same "back top-left / paramètres top-right / rules-in-paramètres" consistency pass should also be audited across the root hub's `public/games/**` (non-card) games - that convention is already documented as mandatory in `docs/NEW_GAME.md` (`game-header.js`/`.css`), but whether every existing game actually complies hasn't been checked.
- Commit and push: the la Bataille Corse pile-reveal/hold fixes above, the earlier la Bataille Corse + Président instant-feedback fixes, the language-switcher/rules-consolidation fix, and the `AGENTS.md` rule updates.
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` - accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion.
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-17 la Bataille Corse: pile-win now animates - cards sweep toward the winning seat's stock and shrink away (`.bataillecorse-pile-fly`) during the 2s hold, instead of sitting static then vanishing.
- 2026-09-17 la Bataille Corse: removed the self-flip face-down pile placeholder (`pendingSelfFlip`) so a played card always appears face-up directly, and added a 2s post-win pile freeze (`useDisplayPile`) so a double/sandwich pattern is actually visible before the pile clears.
- 2026-09-17 Fixed la Bataille Corse's duplicate language-switcher bug (`LanguageSwitcher.tsx` exclusion list) and consolidated "Règles" into `HomeTopBar`'s paramètres panel for all 4 games (removed each page's separate Règles button); extended the `AGENTS.md` shared-base rule accordingly.
- 2026-09-17 `AGENTS.md`: added a "shared base, differentiate on top" rule for the 4 card games (names the existing shared modules, incl. `TrickStage.tsx` for the played-card-to-center animation) alongside the instant-local-feel rule.
- 2026-09-17 Added `AGENTS.md` rule mandating instant local simulation for every card game's own-player action; audited all 4 tables against it and fixed the 2 real gaps found: la Bataille Corse (`useOptimisticFlip.ts`) and Président (`usePresidentOptimisticPlay.ts`, which had none at all). Coinche/Bouilla already complied.
- 2026-09-17 `docs/PRODUCT.md`: tablette/desktop added (user-confirmed); mobile-first kept.

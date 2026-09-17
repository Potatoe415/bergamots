# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: la Bataille Corse's multiplayer pile-win feedback (fly animation, reaction-time readouts, tribute banner) just got a round of polish based on live user testing - committing now.
Last_Action: Committed and pushed la Bataille Corse's pile-win/reaction-time/tribute-banner polish pass: self-flip no longer shows a face-down placeholder, a double/sandwich win holds the pile on screen and animates it flying to the winner's deck (tuned twice per user feedback: now 3400ms, `46svh`, held for `HOLD_PILE_MS`=3600ms so it isn't cut off), the winning deck gets a flame glow, each player's reaction-time readout sits on the pile-facing side of their own deck (ms, 2 decimals, 5s) instead of clumped bottom-center, and the tribute banner is now just "{player} : {attempts} carte(s)". Left out an unrelated pre-existing `public/games/yatsy/styles.css` change (not part of this work).
Next_Actions:
- Real-device test (2 phones, actual network) of la Bataille Corse online + ad-hoc: confirm the pile-fly sweep now visibly reaches each deck at the slower pace, both reaction readouts sit correctly for a full 5s, the winner's deck fire glow reads well, and the short tribute banner is still clear.
- Real 2-device test of la Bataille Corse online + ad-hoc - specifically the slap race with real network latency between two phones.
- Real 2-device test of Président online - confirm the instant combo-play feedback feels right with real network latency.
- Ask the user to sanity-check the "classic" Bataille Corse ruleset (double+sandwich only) once actually played.
- Investigate whether `lib/client/useBotRunner.ts`'s Coinche-brain-default bug also silently affects Président's online bots today.
- Ask the user whether the same "back top-left / paramètres top-right / rules-in-paramètres" consistency pass should also be audited across the root hub's `public/games/**` (non-card) games - that convention is already documented as mandatory in `docs/NEW_GAME.md` (`game-header.js`/`.css`), but whether every existing game actually complies hasn't been checked.
- Decide on the unrelated `public/games/yatsy/styles.css` local change spotted during this commit (12 lines added, not yet committed) - separate from this app entirely, needs its own look.
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` - accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion.
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-17 la Bataille Corse: pile-fly sweep tuned twice - final: 3400ms duration, `46svh` distance, `HOLD_PILE_MS`=3600ms.
- 2026-09-17 la Bataille Corse: reaction-time readout switched from seconds/3-decimals to raw ms/2-decimals; my own readout moved above my deck (opponent's stays below theirs) - each sits on the side facing the pile.
- 2026-09-17 la Bataille Corse: tribute banner text simplified to just "{player} : {attempts} carte(s)" (was a full sentence explaining the figure/ace rule).
- 2026-09-17 la Bataille Corse: pile-win now animates - cards sweep toward the winning seat's stock and shrink away (`.bataillecorse-pile-fly`); winner's deck gets a flickering fire glow (`useWinnerFireSeat`).
- 2026-09-17 la Bataille Corse: removed the self-flip face-down pile placeholder (`pendingSelfFlip`) so a played card always appears face-up directly, and added a post-win pile freeze (`useDisplayPile`) so a double/sandwich pattern is actually visible before the pile clears.

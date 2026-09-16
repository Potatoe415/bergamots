# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" (2-player-only reflex game) shipped end-to-end (local/online/ad-hoc), alongside Coinche, la Bouilla, and Président. Its slap race is resolved by comparing each side's own locally-measured reaction time, never network arrival order. Seat count is now per-game-type (`seatCountFor`) since this is the first non-4-seat game. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: la Bataille Corse's table UI was reworked per user feedback: played cards now animate/scatter into the center pile like Président's (2+ dimmed history cards visible, tilted alternately), the flip ("Retourner") button sits directly above the slap ("TAPE !") button as one centered column, and every card-count display is now visually discreet (small, muted). Verified via `tsc`/lint/vitest and a live browser smoke test. Needs a commit+push, then the same real 2-device testing gap as before.
Last_Action: Reworked `components/BataillecorseTable.tsx`: new `PileStack` (replaces `PileFan`) reuses `TrickStage.tsx`'s `played-card-enter` animation for the newest card (direction inferred from which seat's stock count just dropped, via `usePileEnterDirection`) plus fixed left/right-tilt `HISTORY_OFFSETS` (Président's pattern) for the 1-2 cards behind it, dimmed. Center block now stacks the flip button above the slap button, both centered under the pile/banners. All stock-count text (header tally, both seat rows) shrunk/muted for a "plus discret" look.
Next_Actions:
- Commit and push the above.
- Real 2-device test of la Bataille Corse online + ad-hoc (only local solo and one-browser online/ad-hoc-setup smoke testing was possible in this session) - specifically verify the slap race feels fair with real network latency between two phones.
- Ask the user to sanity-check the "classic" ruleset choice (double+sandwich only, no Big Mac/suite/somme-de-10) feels right once actually played, since it was a pre-build decision.
- Investigate whether `lib/client/useBotRunner.ts`'s Coinche-brain-default bug (fixed for bataillecorse in the previous session) also silently affects Président's online bots today.
- Manually play a round through the exchange phase online/local to confirm: crown+confetti appear the instant someone plays their last card while others keep playing; exchange panel shows cards in rank order with no stray yellow ring; Trou du Cul/Vice-Trou du Cul see their sent cards during the wait. (carried over from before, still unverified)
- Ask the user to hard-refresh Coinche/Bouilla/Président on an iPhone (plain Safari tab and installed PWA) and confirm the hand of cards no longer sits under/behind the home indicator and no scroll is needed (carried over, still unverified).
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` (same trust model as bot hands/ad-hoc host already accepted) - a malicious client could in principle lie about its own reaction time to always win. Same category of accepted trade-off as the existing ones below, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - acceptable long-term? Same trust model means an ad-hoc P2P host could in theory cheat (no server arbitration in that mode) - accepted trade-off, discussed with user, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human, or stay a bot for the rest of that game as implemented?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion - acceptable, per DECISIONS?
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-16 la Bataille Corse: table UI reworked - scattered/animated pile (Président-style), flip button moved above the slap button (one centered column), card counts made visually discreet. Not yet committed.
- 2026-09-16 la Bataille Corse: fourth game shipped (local/online/ad-hoc) - 2-player reflex game, figure/ace tribute challenges, double/sandwich slap race resolved via each side's own locally-measured reaction time. `seatCountFor` generalizes seat count off the previous hardcoded 4. Committed and pushed.
- 2026-09-16 Fixed a latent bug: `lib/client/useBotRunner.ts` crashed on any game type it didn't explicitly recognize (defaulted to the Coinche bot brain) - now excludes `bataillecorse`. Not yet committed.
- 2026-09-16 Fixed `BotSeatPicker.tsx` hardcoding 4 seats regardless of the actual roster passed in - now derives seats from `players`. Not yet committed.
- 2026-09-15 Président: crown/confetti, exchange-panel fixes, forced-transfer visibility for Trou du Cul/Vice-Trou du Cul. Committed and pushed.
- 2026-09-15 Coinche/Bouilla/Président: hand of cards keeps clearance above the iPhone home indicator via a safe-area-based spacer. Committed and pushed.

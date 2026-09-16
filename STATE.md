# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" (2-player-only reflex game) shipped end-to-end (local/online/ad-hoc), alongside Coinche, la Bouilla, and Président. Its slap race is resolved by comparing each side's own locally-measured reaction time, never network arrival order. Seat count is now per-game-type (`seatCountFor`) since this is the first non-4-seat game. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: la Bataille Corse is implemented, tested (32 new unit tests, `tsc`/lint clean, live-smoke-tested via browser: local solo play, online 2-seat lobby + real server actions, ad-hoc host-setup QR flow) - needs a commit+push, then real 2-device testing (online + ad-hoc) since only solo/one-browser smoke testing was possible here.
Last_Action: Added `lib/bataillecorse` (pure rules engine: cards/deal/pattern/tribute/engine/bot/redact/types, 32 tests). Wired into every shared layer: `lib/supabase/types.ts` (`GameType`, `seatCountFor`), `lib/server/{view,game-dispatch,actions-game,actions-lobby,idle-timer,repo}.ts` (new `flipCard`/`attemptSlap` actions, `flip`/`slap` BotMove/HeuristicMove variants, new `lib/server/slap-timer.ts`), client (`useLocalBataillecorseGame.ts`, `useBataillecorseBotRunner.ts`, `useP2PBataillecorseHost.ts`, `lib/client/p2p/protocol.ts`/`useP2PClient.ts`), UI (`components/BataillecorseTable.tsx`, `BataillecorseLocalGame.tsx`, `p2p/P2PBataillecorseHostGame.tsx`), pages (`app/bataillecorse/page.tsx`, `app/page.tsx` tile, `app/local`/`app/online`/`AdHocLobby.tsx` branches), i18n strings, `RulesModal.tsx` content. Generalized `Lobby.tsx`/`BotSeatPicker.tsx`/`actions-lobby.ts` off a hardcoded 4-seat assumption via `seatCountFor`. Fixed two real bugs found while building this: (1) a local-hook/online-bot-runner stuck-turn bug (effects keyed on `turn` alone missed re-firing when only `tribute.attemptsLeft` changed across several flips by the same seat); (2) `lib/client/useBotRunner.ts` crashing on `bataillecorse`'s view shape (it defaulted any non-"bouilla" game to the Coinche ISMCTS brain - now explicitly excludes `bataillecorse`; Président may have the same latent issue, left alone, see BACKLOG). Docs updated (PRODUCT/TECH/DATA_MODEL/BACKLOG/DECISIONS) - user explicitly authorized the PRODUCT.md/TECH.md edits. Not yet committed.
Next_Actions:
- Commit and push the above.
- Real 2-device test of la Bataille Corse online + ad-hoc (only local solo and one-browser online/ad-hoc-setup smoke testing was possible in this session) - specifically verify the slap race feels fair with real network latency between two phones.
- Ask the user to sanity-check the "classic" ruleset choice (double+sandwich only, no Big Mac/suite/somme-de-10) feels right once actually played, since it was a pre-build decision.
- Investigate whether `lib/client/useBotRunner.ts`'s Coinche-brain-default bug (see Last_Action) also silently affects Président's online bots today.
- Manually play a round through the exchange phase online/local to confirm: crown+confetti appear the instant someone plays their last card while others keep playing; exchange panel shows cards in rank order with no stray yellow ring; Trou du Cul/Vice-Trou du Cul see their sent cards during the wait. (carried over from before, still unverified)
- Ask the user to hard-refresh Coinche/Bouilla/Président on an iPhone (plain Safari tab and installed PWA) and confirm the hand of cards no longer sits under/behind the home indicator and no scroll is needed (carried over, still unverified).
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` (same trust model as bot hands/ad-hoc host already accepted) - a malicious client could in principle lie about its own reaction time to always win. Same category of accepted trade-off as the existing ones below, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - acceptable long-term? Same trust model means an ad-hoc P2P host could in theory cheat (no server arbitration in that mode) - accepted trade-off, discussed with user, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human, or stay a bot for the rest of that game as implemented?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion - acceptable, per DECISIONS?
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-16 la Bataille Corse: fourth game shipped (local/online/ad-hoc) - 2-player reflex game, figure/ace tribute challenges, double/sandwich slap race resolved via each side's own locally-measured reaction time. `seatCountFor` generalizes seat count off the previous hardcoded 4. Not yet committed.
- 2026-09-16 Fixed a latent bug: `lib/client/useBotRunner.ts` crashed on any game type it didn't explicitly recognize (defaulted to the Coinche bot brain) - now excludes `bataillecorse`. Not yet committed.
- 2026-09-16 Fixed `BotSeatPicker.tsx` hardcoding 4 seats regardless of the actual roster passed in - now derives seats from `players`. Not yet committed.
- 2026-09-15 Président: crown/confetti, exchange-panel fixes, forced-transfer visibility for Trou du Cul/Vice-Trou du Cul. Committed and pushed.
- 2026-09-15 Coinche/Bouilla/Président: hand of cards keeps clearance above the iPhone home indicator via a safe-area-based spacer. Committed and pushed.

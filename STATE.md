# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Third game "Président" (Trou du cul) shipped end-to-end (local/online/ad-hoc), alongside Coinche and "la Bouilla". Online games have an idle-turn timer with permanent bot takeover. Local solo play is offline/reload-proof (PWA + localStorage). Online finished screens offer a same-room rematch. Reaction picker sends Giphy GIFs next to emojis (online + local). Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Président UX polish batch: crown/confetti on becoming president, exchange-panel visual fixes, and letting the Trou du Cul/Vice-Trou du Cul see their forced-transfer cards - now done, needs a commit+push and a real-device sanity check.
Last_Action: `PresidentTable.tsx` - added a confetti+crown celebration (`PresidentCrownedFlash`, keyed off `PlayerView.finishedOrder[0]` via the same diff-key pattern as `useSkipFlash`) plus a persistent 👑 before the round's president's name (`PlayerBadge`/`SelfNameChip`, new optional `isPresident` prop). `PresidentExchangePanel.tsx` - cards are now sorted by rank value (`rankValue`) and no longer show the always-on "playable" gold ring (new `PlayingCard` prop `showPlayableRing`, defaults true, set false here); only the actually-selected card gets the yellow ring. New `GameState.forcedTransfers` field (`lib/president/types.ts`, moved `ForcedTransfer` there from `exchange.ts`) records the forced exchange's face-up card movement so the Trou du Cul/Vice-Trou du Cul (never in `pendingExchange.awaiting`) can see which of their best cards were sent away, even though it's automatic - exposed via `PlayerView.forcedTransfers` (`redact.ts`), rendered in `PresidentExchangePanel.tsx`'s "waiting" branch. `docs/DATA_MODEL.md` updated. `tsc --noEmit` clean, all 55 `lib/president` tests pass. Not yet committed.
Next_Actions:
- Commit and push the above (explicitly requested).
- Manually play a round through the exchange phase online/local to confirm: crown+confetti appear the instant someone plays their last card while others keep playing; exchange panel shows cards in rank order with no stray yellow ring; Trou du Cul/Vice-Trou du Cul see their sent cards during the wait.
- Ask the user to hard-refresh Coinche/Bouilla/Président on an iPhone (plain Safari tab and installed PWA) and confirm the hand of cards no longer sits under/behind the home indicator and no scroll is needed (carried over, still unverified).
- Manually play a few local solo Président games to sanity-check the bot feels smarter (protects pairs, doesn't dump Aces early) without feeling passive/stuck.
- Investigate the `PresidentTable.tsx` `IconLink` hydration warning seen in dev mode (server/client mismatch, not yet triaged).
- Wire `useMatchStats` into the scoring/finished screen (pending from before, unrelated to Président).
Open_Questions:
- Trusted-runner: host can see opponent-bot hands in mixed games - acceptable long-term? Same trust model means an ad-hoc P2P host could in theory cheat (no server arbitration in that mode) - accepted trade-off, discussed with user, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human, or stay a bot for the rest of that game as implemented?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion - acceptable, per DECISIONS?
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-15 Président: `GameState.forcedTransfers` added - Trou du Cul/Vice-Trou du Cul now see which of their best cards were forcibly sent away during the exchange, instead of just a generic "waiting" message. Not yet committed.
- 2026-09-15 Président: exchange panel cards now sort by rank value and no longer show a permanent gold "playable" ring on every card (only the selected one is highlighted, via new `PlayingCard` prop `showPlayableRing`). Not yet committed.
- 2026-09-15 Président: new crown+confetti celebration (`PresidentCrownedFlash`) plus a persistent 👑 before the round's president's name while the round finishes out. Not yet committed.
- 2026-09-15 Coinche/Bouilla/Président: bottom spacer below the table now has a `safe-area-inset-bottom`-based minimum height, so the hand of cards always keeps clearance above the iPhone home indicator instead of needing a scroll to reveal it. `viewportFit: "cover"` added in `app/layout.tsx`. Committed and pushed.
- 2026-09-15 Président: bot (`lib/president/bot.ts`) rewritten with pair/master-rank protection and endgame-aware voluntary passing, per the user's strategy prompt (see DECISIONS). Committed and pushed.

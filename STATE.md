# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Third game "Président" (Trou du cul) shipped end-to-end (local/online/ad-hoc), alongside Coinche and "la Bouilla". Online games have an idle-turn timer with permanent bot takeover. Local solo play is offline/reload-proof (PWA + localStorage). Online finished screens offer a same-room rematch. Reaction picker sends Giphy GIFs next to emojis (online + local). Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Président bot uses stronger strategic heuristics (pair/master protection, endgame override). Committed and pushed (`6237126`).
Last_Action: Rewrote `lib/president/bot.ts`'s `chooseAction` per the user's supplied "master player" strategy prompt, translated into deterministic TS rules (user chose this over a real per-move LLM call - see `docs/DECISIONS.md` 2026-09-15). Exchange gives away true singletons before ever breaking a group; play never spends a group-breaking or master-rank (2/Ace) combo unless it's free or the endgame is looming, otherwise it voluntarily `PASS`es. Added 9 `bot.test.ts` cases plus a 50-seed `advanceBots` sweep in `engine.test.ts` guarding against the guard-500 stall risk from the new voluntary passing. Full suite (196 tests), typecheck, and lint all pass. Left unrelated uncommitted hand-curve edits in `BouillaTable.tsx`/`GameTable.tsx`/`HandCardSlot.tsx` untouched (pre-existing, not part of this task).
Next_Actions:
- Manually play a few local solo Président games to sanity-check the new bot feels smarter (protects pairs, doesn't dump Aces early) without feeling passive/stuck.
- Manually verify in Président: replaying the pile's rank still skips the next seat when that seat has no matching card, but is spared (normal turn, no flash) when it does - including the chain case (spared seat replays, next seat gets checked the same way).
- Ask the user to hard-refresh Coinche/Bouilla/Président on the iPhone once `98172ec` is deployed and confirm the GIF picker thumbnails are no longer squashed.
- Investigate the `PresidentTable.tsx` `IconLink` hydration warning seen in dev mode (server/client mismatch, not yet triaged).
- Wire `useMatchStats` into the scoring/finished screen (pending from before, unrelated to Président).
Open_Questions:
- Trusted-runner: host can see opponent-bot hands in mixed games - acceptable long-term?
- Should a permanently-bot-converted seat ever be reclaimable by its original human, or stay a bot for the rest of that game as implemented?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion - acceptable, per DECISIONS?
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?
- Ad-hoc P2P host hooks are now 3 parallel ~200-line files (Coinche/Bouilla/Président) - generalize now, or keep deferring per the accepted N=2 and N=3 trade-offs?

Recent_Changes:
- 2026-09-15 Président: bot (`lib/president/bot.ts`) rewritten with pair/master-rank protection and endgame-aware voluntary passing, per the user's strategy prompt (see DECISIONS). Not yet committed.
- 2026-09-15 Président: hand sort default is now by rank/value (was suit/color); the button still toggles the other way. Committed and pushed.
- 2026-09-15 Président: the "double" rule's skip is now spared when the would-be-skipped seat also holds a card of the matching rank (it gets its normal turn instead; chains naturally if it replays the rank itself).
- 2026-09-13 GifPicker: fixed vertical squash on iOS WebKit - `<button>` needed `appearance-none` (Tailwind's `-webkit-appearance: button` was breaking overflow-hidden/rounded-md clipping on the object-cover `<img>`); shared by Coinche/Bouilla/Président.
- 2026-09-11 Président: new "double" house rule (always on) - replaying the pile's exact rank/count instead of beating it is now legal, skips the next seat (new "Tour sauté" flash), and burns the pile like a "2" once all 4 cards of that rank are down.

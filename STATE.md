# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Third game "Président" (Trou du cul) shipped end-to-end (local/online/ad-hoc), alongside Coinche and "la Bouilla". Online games have an idle-turn timer with permanent bot takeover. Local solo play is offline/reload-proof (PWA + localStorage). Online finished screens offer a same-room rematch. Reaction picker sends Giphy GIFs next to emojis (online + local). Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Added an exception to Président's "double" rule (skip is spared when the target seat also holds the matching rank); idle, awaiting next request.
Last_Action: `lib/president/play.ts`'s `applyPlay` "double" skip now checks the would-be-skipped seat's hand (`hasRank`): if it holds a card of the pile's rank, the skip is called off and that seat gets its normal turn instead (no `lastSkip`, no chain logic needed - a seat that then replays the rank itself just re-triggers the same check against the next seat). Burn-to-4 case unaffected (checked first). Added 2 new `play.test.ts` cases (spared skip + chaining), updated both-language rules modal text (`RulesModal.tsx`). Vitest (47 passed), `tsc --noEmit`, and eslint all green. Logged in `docs/DECISIONS.md` (2026-09-15). Committed and pushed (`2b1b67b`); left a parallel session's unrelated uncommitted changes untouched (`PresidentTable.tsx` hand default sort + `BouillaTable.tsx`/`GameTable.tsx`/`HandCardSlot.tsx`).
Next_Actions:
- Manually verify in Président: replaying the pile's rank still skips the next seat when that seat has no matching card, but is spared (normal turn, no flash) when it does - including the chain case (spared seat replays, next seat gets checked the same way).
- Manually verify in Président: playing the same rank as the pile (single/pair/triple) is accepted, skips the next seat with the "Tour sauté" flash, and completing 4 of that rank burns the pile with the existing fly animation.
- Ask the user to hard-refresh Coinche/Bouilla/Président on the iPhone once `98172ec` is deployed and confirm the GIF picker thumbnails are no longer squashed.
- Investigate the `PresidentTable.tsx` `IconLink` hydration warning seen in dev mode (server/client mismatch, not yet triaged).
- Manually check the new square tile grid on an actual phone width (3-up may feel tight/cramped below ~360px screens).
- Wire `useMatchStats` into the scoring/finished screen (pending from before, unrelated to Président).
Open_Questions:
- Trusted-runner: host can see opponent-bot hands in mixed games - acceptable long-term?
- Should a permanently-bot-converted seat ever be reclaimable by its original human, or stay a bot for the rest of that game as implemented?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion - acceptable, per DECISIONS?
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?
- Ad-hoc P2P host hooks are now 3 parallel ~200-line files (Coinche/Bouilla/Président) - generalize now, or keep deferring per the accepted N=2 and N=3 trade-offs?

Recent_Changes:
- 2026-09-15 Président: the "double" rule's skip is now spared when the would-be-skipped seat also holds a card of the matching rank (it gets its normal turn instead; chains naturally if it replays the rank itself).
- 2026-09-15 Président: hand sort default is now by rank/value (was suit/color); the button still toggles the other way.
- 2026-09-13 GifPicker: fixed vertical squash on iOS WebKit - `<button>` needed `appearance-none` (Tailwind's `-webkit-appearance: button` was breaking overflow-hidden/rounded-md clipping on the object-cover `<img>`); shared by Coinche/Bouilla/Président.
- 2026-09-11 Président: new "double" house rule (always on) - replaying the pile's exact rank/count instead of beating it is now legal, skips the next seat (new "Tour sauté" flash), and burns the pile like a "2" once all 4 cards of that rank are down.
- 2026-09-11 Président: current pile play is now centered regardless of card count, and the 1-2 older plays behind it use a fixed left/right offset + tilt (`HISTORY_OFFSETS`) instead of a plain diagonal stack, for a scattered-heap look.

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Third game "Président" (Trou du cul) shipped end-to-end (local/online/ad-hoc), alongside Coinche and "la Bouilla". Online games have an idle-turn timer with permanent bot takeover. Local solo play is offline/reload-proof (PWA + localStorage). Online finished screens offer a same-room rematch. Reaction picker sends Giphy GIFs next to emojis (online + local). Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Fixed the GIF reaction picker being vertically squashed on iOS (Safari + Chrome/WebKit) across Coinche/Bouilla/Président; idle, awaiting next request.
Last_Action: `components/GifPicker.tsx` grid thumbnails looked vertically squashed on iPhone (same bug family already fixed in the sibling `bergamots` repo's Yatzy game, but a different root cause here: the `<img>` already used a fixed `h-20`, not a percentage). Root cause: Tailwind's preflight sets `-webkit-appearance: button` on all `<button>` elements, and WebKit has a known bug where that native button chrome can ignore `overflow-hidden` + `rounded-md` clipping on children, breaking the `object-cover` image. Fixed by adding `appearance-none` plus an explicit `h-20 w-full` on the button (matching the img) and `rounded-md` directly on the `<img>` as defense-in-depth. Lint + `tsc --noEmit` both green. Committed and pushed (`98172ec`); shared by Coinche/Bouilla/Président since they all use `EmojiButton`/`GifPicker`.
Next_Actions:
- Ask the user to hard-refresh Coinche/Bouilla/Président on the iPhone once `98172ec` is deployed and confirm the GIF picker thumbnails are no longer squashed.
- Manually verify in Président: playing the same rank as the pile (single/pair/triple) is accepted, skips the next seat with the "Tour sauté" flash, and completing 4 of that rank burns the pile with the existing fly animation.
- Manually verify in Président: a 2/3/4-card combo lands centered on the felt, and the 1-2 previous plays sit tilted left/right behind it rather than in a straight diagonal line.
- If the sort button is missing after a local reload, unregister the old service worker once (or hard-refresh) so the new `sw.js` can take over.
- Manually verify on a phone: single-card turns play on tap, forced passes auto-trigger after ~2s, 2s burn the pile with the fly animation, hand-sort toggles suit vs rank.
- Investigate the `PresidentTable.tsx` `IconLink` hydration warning seen in dev mode (server/client mismatch, not yet triaged).
- Manually check the new square tile grid on an actual phone width (3-up may feel tight/cramped below ~360px screens).
- Manually play a full Président match online/ad-hoc too: verify revolution banner, round overlay title reveal, scoreboard, and the new double/skip rule with bots.
- Wire `useMatchStats` into the scoring/finished screen (pending from before, unrelated to Président).
Open_Questions:
- Trusted-runner: host can see opponent-bot hands in mixed games - acceptable long-term?
- Should a permanently-bot-converted seat ever be reclaimable by its original human, or stay a bot for the rest of that game as implemented?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion - acceptable, per DECISIONS?
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?
- Ad-hoc P2P host hooks are now 3 parallel ~200-line files (Coinche/Bouilla/Président) - generalize now, or keep deferring per the accepted N=2 and N=3 trade-offs?

Recent_Changes:
- 2026-09-13 GifPicker: fixed vertical squash on iOS WebKit - `<button>` needed `appearance-none` (Tailwind's `-webkit-appearance: button` was breaking overflow-hidden/rounded-md clipping on the object-cover `<img>`); shared by Coinche/Bouilla/Président.
- 2026-09-11 Président: new "double" house rule (always on) - replaying the pile's exact rank/count instead of beating it is now legal, skips the next active seat (new "Tour sauté" flash), and burns the pile like a "2" once all 4 cards of that rank are down.
- 2026-09-11 Président: current pile play is now centered regardless of card count, and the 1-2 older plays behind it use a fixed left/right offset + tilt (`HISTORY_OFFSETS`) instead of a plain diagonal stack, for a scattered-heap look.
- 2026-09-11 Président: rounds-to-play options narrowed to 1/2/3/4/5 (was 3/4/5/6/8), per user request.
- 2026-09-11 Président: fixed a blocking bug reported by the user - from round 2 on, the end-of-round score table stayed on screen forever after pressing "Manche suivante", hiding the exchange panel underneath (game looked frozen). Root cause: `beginNextRound` never cleared `lastRoundResult`, unlike Bouilla's equivalent. Regression test added.

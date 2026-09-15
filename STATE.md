# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Third game "Président" (Trou du cul) shipped end-to-end (local/online/ad-hoc), alongside Coinche and "la Bouilla". Online games have an idle-turn timer with permanent bot takeover. Local solo play is offline/reload-proof (PWA + localStorage). Online finished screens offer a same-room rematch. Reaction picker sends Giphy GIFs next to emojis (online + local). Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Fix iPhone home-indicator overlap - the hand of cards was rendering below the bottom system bar on some iPhones, forcing a scroll to reveal it, across Coinche/Bouilla/Président.
    10|Last_Action: In `GameTable.tsx`/`BouillaTable.tsx`/`PresidentTable.tsx`, the bottom `flex-1` spacer of the top-spacer/720px-scene/bottom-spacer column now carries `min-h-[calc(env(safe-area-inset-bottom)+12px)]` instead of no minimum, guaranteeing a visible gap below the hand fan; the equal-`flex-1` top spacer shrinks first when space is tight, which also nudges the whole table upward. Added `viewportFit: "cover"` to `app/layout.tsx`'s viewport export so `env(safe-area-inset-bottom)` reports the real iOS inset instead of 0. `tsc --noEmit` clean; pre-existing lint issues (`useMatchStats.ts`, `DealOverlay.tsx`, a test file) are unrelated/untouched. Not yet committed; not yet verified on a real iPhone.
Next_Actions:
- Ask the user to hard-refresh Coinche/Bouilla/Président on an iPhone (plain Safari tab and installed PWA) and confirm the hand of cards no longer sits under/behind the home indicator and no scroll is needed.
- Manually play a few local solo Président games to sanity-check the bot feels smarter (protects pairs, doesn't dump Aces early) without feeling passive/stuck.
- Manually verify in Président: replaying the pile's rank still skips the next seat when that seat has no matching card, but is spared (normal turn, no flash) when it does - including the chain case (spared seat replays, next seat gets checked the same way).
- Investigate the `PresidentTable.tsx` `IconLink` hydration warning seen in dev mode (server/client mismatch, not yet triaged).
- Wire `useMatchStats` into the scoring/finished screen (pending from before, unrelated to Président).
Open_Questions:
- Trusted-runner: host can see opponent-bot hands in mixed games - acceptable long-term?
- Should a permanently-bot-converted seat ever be reclaimable by its original human, or stay a bot for the rest of that game as implemented?
    20|- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion - acceptable, per DECISIONS?
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?
- Ad-hoc P2P host hooks are now 3 parallel ~200-line files (Coinche/Bouilla/Président) - generalize now, or keep deferring per the accepted N=2 and N=3 trade-offs?

Recent_Changes:
- 2026-09-15 Coinche/Bouilla/Président: bottom spacer below the table now has a `safe-area-inset-bottom`-based minimum height, so the hand of cards always keeps clearance above the iPhone home indicator instead of needing a scroll to reveal it. `viewportFit: "cover"` added in `app/layout.tsx`. Not yet committed.
- 2026-09-15 Président: bot (`lib/president/bot.ts`) rewritten with pair/master-rank protection and endgame-aware voluntary passing, per the user's strategy prompt (see DECISIONS). Not yet committed.
- 2026-09-15 Président: hand sort default is now by rank/value (was suit/color); the button still toggles the other way. Committed and pushed.
- 2026-09-15 Président: the "double" rule's skip is now spared when the would-be-skipped seat also holds a card of the matching rank (it gets its normal turn instead; chains naturally if it replays the rank itself).
- 2026-09-13 GifPicker: fixed vertical squash on iOS WebKit - `<button>` needed `appearance-none` (Tailwind's `-webkit-appearance: button` was breaking overflow-hidden/rounded-md clipping on the object-cover `<img>`); shared by Coinche/Bouilla/Président.
    30|

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Keep la Bataille Corse table iteration moving; slap impact on the center pile is live.
Last_Action: Strengthened the slap hit on the middle cards: same-frame squash/tilt, yellow flash, and a shockwave ring, then a slam before the pile flies on a slap/false-slap win.
Next_Actions:
- Ask the user to slap a real double and confirm the center cards now punch hard enough.
- Ask the user to confirm the same reaction-time readout online (2 phones): opponent on the right, shorter time yellow.
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit before touching it.
- Ask the user to sanity-check the new stats live: play a full match to completion in each of the 4 games, confirm the counter increments correctly in `HomeTopBar`'s settings panel on `/`, `/coinche`, `/bouilla`, `/president`, `/bataillecorse`.
- Ask the user to verify the new la Bataille Corse changes live: trigger an As tribute with 2+ plain attempts before the answering As to confirm the slap window now opens.
- Fix the unrelated pre-existing `useMatchStats.ts` lint error (flagged, not fixed, since it's out of scope for this change) if a future pass touches that file.
- Ask the user to retest online Président with 2 humans + 2 bots to confirm bots now play through the first turn (and the exchange phase) instead of stalling.
- Real-device test (2 phones, actual network) of la Bataille Corse online + ad-hoc: confirm the pile-fly sweep now visibly reaches each deck at the slower pace, both reaction readouts sit correctly for a full 5s, the winner's deck fire glow reads well, and the short tribute banner is still clear.
- Real 2-device test of Président online - confirm the instant combo-play feedback feels right with real network latency, now that online bots actually work.
- Ask the user to sanity-check the "classic" Bataille Corse ruleset (double+sandwich only) once actually played.
- Ask the user whether the same "back top-left / paramètres top-right / rules-in-paramètres" consistency pass should also be audited across the root hub's `public/games/**` (non-card) games - that convention is already documented as mandatory in `docs/NEW_GAME.md` (`game-header.js`/`.css`), but whether every existing game actually complies hasn't been checked.
- Decide on the unrelated `public/games/yatsy/styles.css` local change spotted during this commit (12 lines added, not yet committed) - separate from this app entirely, needs its own look.
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` - accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion.
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?

Recent_Changes:
- 2026-09-18 la Bataille Corse: slap now punches the center cards (squash, yellow flash, shockwave) the instant you tap; slap/false-slap wins slam then fly.
- 2026-09-18 la Bataille Corse: both reaction times always sit above the phone-holder's deck (`{mine}s | {opponent}s`), solo and online; the shorter time glows yellow.
- 2026-09-18 la Bataille Corse: false slap awards the whole pile to the opponent and flashes a red WRONG cross the size of the slap circle (replaces the 1-card-under-the-pile penalty).
- 2026-09-18 la Bataille Corse: slap/tribute pile-win no longer replays the last card's slide-in (`PileCurrentCard` skips `.played-card-enter` while the stack is flying).
- 2026-09-17 la Bataille Corse: figure/ace slaps now ignore tribute filler cards (`detectSlapPattern`), reaction time shown in seconds/2-decimals (was ms), online mode shows one merged "{mine} s / {opponent} s" readout in `--accent-yellow` above own deck instead of two separate readouts.

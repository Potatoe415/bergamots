# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Fix reported bug - online Président (2 humans + 2 bots) bot seats stall forever on the first turn.
Last_Action: Confirmed and fixed the root cause in `lib/client/useBotRunner.ts` (the Coinche-brain-default bug flagged as an open question was real for Président): `isActiveTurn` didn't recognize Président's `"exchange"` phase, and the decide/submit effect always called the Coinche ISMCTS worker (`decideCoinche`) for any non-`"bouilla"` game type, including Président's `"playing"` phase - producing a move `submitBotMove` could never apply, so the effect kept catching, refetching, and retrying the same turn forever. Added a `"president"` branch calling `decidePresidentAction`/`toPresidentMove` (mirrors Bouilla's instant-heuristic + `thinkMs` pacing) and widened `isActiveTurn` to both Président phases. Added `lib/client/useBotRunner.test.ts` (6 tests, pure-function coverage of `isActiveTurn`/`toPresidentMove`) and reran the full suite (237/237 pass) + typecheck + lint clean. Not yet committed.
Next_Actions:
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
- 2026-09-17 Fixed online Président bots stalling forever on the first turn: `lib/client/useBotRunner.ts` fell through to the Coinche bot brain for any non-Bouilla game type and never recognized the "exchange" phase; added a dedicated Président branch + widened `isActiveTurn`, plus `useBotRunner.test.ts`.
- 2026-09-17 la Bataille Corse: pile-fly sweep tuned twice - final: 3400ms duration, `46svh` distance, `HOLD_PILE_MS`=3600ms.
- 2026-09-17 la Bataille Corse: reaction-time readout switched from seconds/3-decimals to raw ms/2-decimals; my own readout moved above my deck (opponent's stays below theirs) - each sits on the side facing the pile.
- 2026-09-17 la Bataille Corse: tribute banner text simplified to just "{player} : {attempts} carte(s)" (was a full sentence explaining the figure/ace rule).
- 2026-09-17 la Bataille Corse: pile-win now animates - cards sweep toward the winning seat's stock and shrink away (`.bataillecorse-pile-fly`); winner's deck gets a flickering fire glow (`useWinnerFireSeat`).

# DECISIONS

Status: Append-only. Never edit past entries.

---

## Decision threshold

Log a decision if any of the following is true:
- Locks in a technology, library, or vendor.
- Changes the data model, persistence structure, ownership rules, or access model.
- Changes ownership or structure of a file or module.
- Cannot be reversed in under 30 minutes.
- Contradicts a previous entry in this file.

If unsure: add an Open_Question to `STATE.md`, not a decision entry.

---

## Template

## YYYY-MM-DD — Title

Decision: One sentence.
Context: Why this came up.
Rationale: Why this option over others.
Consequences: What this locks in or rules out.
Alternatives_Rejected: What was considered and why it lost.

---

## 2026-06-03 — Bootstrap

Decision: Created project context architecture with agent-agnostic protocol.
Context: New empty project. Need durable memory across sessions and agents.
Rationale: Single canonical file (`AGENTS.md`) with thin routers per tool prevents drift and duplication.
Consequences: All agents must read `AGENTS.md` before acting. `docs/PRODUCT.md` and `docs/TECH.md` are frozen until user authorises changes.
Alternatives_Rejected: Per-agent full protocol files — causes drift. Single flat README — no conditional loading, bloats context.

---

## 2026-06-04 — Co-op bot (Play vs Bot)

Decision: Added a client-side heuristic bot (`shared/src/botAI.ts`) that plays the second player co-operatively in a new "Play vs Bot" local mode.
Context: User wanted a single-player option where a bot partners with the human, without touching existing local/online modes.
Rationale: The game is deterministic and the full `GameState` already lives client-side in local mode, so a pure-function `chooseBotAction(state, idx)` in the shared engine reuses `computeLegalMoves`/`canDiscardTwo` with zero server/network changes. Bot turns are driven by a `setTimeout` effect in `App.tsx`; the human always views as player 0, so the existing online-style grid-diff preview shows the bot's move.
Consequences: Bot logic is greedy (minimise discard cost, ideal-value placement, keep Finish cards). It plays legally and fills ~34/36 but is not a strong solver — adequate as a co-op partner, not optimised for high solo win-rate. Adding stronger play would require search/look-ahead.
Alternatives_Rejected: Server-side bot — unnecessary for local mode and adds network/lifecycle complexity. Full search-based AI — out of scope for the request.

---

## 2026-06-06 — Bot defers finish card to human

Decision: `chooseBotAction` now skips playing the finish card if the human player holds one and the bot can discard-two instead.
Context: When the grid became complete on the bot's turn, the bot immediately played its finish card (and monsters in finish_pending), ending the game with zero human interaction. The user experienced the "last few cards" being auto-played.
Rationale: The finish card is the climactic win moment. If the human holds one it's fair to let them trigger it; the bot yields by discarding-two. If the human has no finish card the bot still plays its own (necessary to make progress).
Consequences: In rare cases where the human never plays their finish card the bot will keep deferring, but the finish card is highlighted as playable so the human will naturally click it. Deadlock is not possible.
Alternatives_Rejected: Always block the bot from finishing — would deadlock when the human also has no finish card. Confirmation dialog before human plays finish card — heavier UX change, fix lives in the wrong layer.

---

## 2026-06-04 — Feasibility-aware bot

Decision: Added `shared/src/gridFeasibility.ts` (segment-slack analysis) and reworked `botAI.ts` to be feasibility-driven and to use Sea Monsters to repair broken grids.
Context: The first greedy bot stalled at ~34/36 because it could create unfillable gaps (e.g. 42 next to 44 with two empty cells between — only 43 fits), which the engine's per-card placement check does not prevent.
Rationale: A run of k empty cells between two placed islands needs k strictly-increasing integers in the open value interval, so segment "slack" = valueSpan − cellSpan; negative slack = unwinnable. The bot now (1) never makes a placement that drives any segment infeasible, (2) prefers roomy placements while still minimising discards, (3) when the grid is already broken, plays a Sea Monster on the card whose removal best restores fillability, and (4) cycles via discard-two when only dead-end plays remain. Weights tuned by 500-game self-play sims (feasibility ≫ card cost ≫ tightness ≫ ideal-fit). Bot-vs-bot win rate rose ~3-4× (std ~7%→26%, monsters ~4%→6-17%). Still reads only its own hand + public grid.
Consequences: Two new shared modules + 5 feasibility tests (51 total). Bot is meaningfully stronger but still greedy (no multi-turn search). A rare engine-level start_discard deadlock (Start drawn when decks are nearly empty) is unchanged and out of scope.
Alternatives_Rejected: Heavier weighting of tight segments — self-play showed it backfires (bot wastes cards avoiding unavoidable endgame tightness). Full look-ahead search — out of scope.

---

## 2026-08-03 — Railway/Socket.IO → Supabase (shared project) + Vercel Functions

Decision: Replaced the Railway-hosted Socket.IO server with Vercel Serverless Functions (`api/`) backed by Supabase Postgres/Auth/Realtime, reusing the exact same Supabase project (and its `games`/`game_players`/`game_events` tables, via `game_type='tranquillity'`) already used by the `coinchapp` project.
Context: There was no database before this — Railway only hosted an in-memory Socket.IO process. The user wanted to drop Railway and go through Supabase instead, reusing the coinchapp Supabase project.
Rationale: coinchapp's schema already has a `game_type` discriminator explicitly designed to host multiple games in one project ("Lets one project host many games"), so no SQL migration was needed — just new rows. Vercel Serverless Functions (not Supabase Edge Functions) were chosen so the existing `@tranquillity/shared` engine package (plain Node/TS) could be reused unmodified, closely mirroring coinchapp's Next.js Server Actions pattern without porting anything to Deno.
Consequences: Online play moves from instant Socket.IO push to a realtime-tick + refetch model (broadcast for near-instant peer notification, `postgres_changes` + 15s poll as backstop) — turns update in roughly ~1s worst case instead of instantly, same trade-off coinchapp already ships with. Player identity is now Supabase anonymous auth (`user_id`) instead of a custom `sessionToken`, persisted by supabase-js in `localStorage` — reconnection is at least as robust as before. The `team` column (coinche-specific) is set to an unused placeholder ('A'/'B' by seat) for tranquillity rows. Join-by-room-code now only lets a new player take over a seat if it has gone stale (no `last_seen_at` heartbeat within 30s) rather than always kicking the guest seat — a deliberate tightening vs. the old Socket.IO handler's unconditional-kick behavior, since a public deployment should not let anyone with a room code hijack an active seat.
Alternatives_Rejected: Supabase Edge Functions (Deno) for the mutation logic — would require porting `shared` off Node and a separate deploy pipeline, for no real benefit here. Dedicated `tranquillity_*` tables in the same Supabase project — rejected in favor of reusing coinchapp's existing `games`/`game_players`/`game_events` tables as-is, since the schema already anticipated this exact reuse and needs zero migration.

---

## 2026-09-06 — Mobile board height: JS-measured `var(--app-height)` on a normal-flow element, never `position: fixed`

Decision: `#game-board` reads its height from a `--app-height` CSS var (kept in sync with `visualViewport.height` by `client/src/lib/syncViewportHeight.ts`) but stays a normal in-flow block (`position: static`). Do not make this element `position: fixed`.
Context: iOS WebKit (Safari and Chrome-on-iOS both run on it) can leave `100dvh` stale after the on-screen toolbar shows/hides, drawing the 5-card hand under the browser chrome. First fix attempt kept the JS-measured height but applied it via `position: fixed; top/left: var(--app-offset-*)`. That made it *worse*: reports went from "rotate the phone to fix it" to "must background/foreground the app entirely" — because a `position: fixed` element is GPU-composited on iOS, and WebKit can cache a stale compositor frame for it that only gets flushed by a full app suspend/resume, not by a resize/orientation event.
Rationale: A plain in-flow block with an explicit pixel `height` re-layouts on every `resize`/`visualViewport` `resize` event like any normal element — no separate compositor layer to go stale. Combined with listeners on `resize`, `orientationchange`, `pageshow`, `focus`, and `visibilitychange` (each re-applying immediately, next frame, and after 300ms to catch mid-animation toolbar transitions), this keeps the board's rendered height correct without ever needing a fixed-position hack.
Consequences: Also reverted a related JS hack that force-set `html`/`body` `overflow: hidden` while `GameBoard` was mounted — unnecessary once the board's own height is correct, and disabling all page scroll may itself interfere with how iOS decides to collapse/expand its toolbar. Any future "make the game board fill the screen on mobile" work must keep it `position: static`/normal flow; reach for `--app-height` (or add more resync triggers) instead of `position: fixed`.
Alternatives_Rejected: `position: fixed` + JS-measured offsets (tried, reverted — see above). Relying on `100dvh` alone (the original bug) — WebKit's dvh recompute is not reliably triggered by SPA-internal viewport changes. `position: absolute` inside a `position: relative` full-height wrapper — adds an extra layer for no benefit over a plain block when the board is the top-level document child.

---

## 2026-09-06 — Corrected diagnosis: the mobile hand bug is horizontal, not vertical

Decision: Replaced `Hand.tsx`'s CSS Grid (`repeat(n, 1fr)`) card row with a `ResizeObserver`-driven layout (`client/src/lib/useElementWidth.ts`) that computes an explicit `cardSize` in JS from the row's measured width, clamps it to `[44px, 104px]`, and switches the row to `overflow-x-auto` (horizontal scroll) instead of clipping once cards hit the 44px floor.
Context: Re-examined the two user-supplied screenshots pixel-by-pixel instead of trusting the original "rotate the phone to fix it" framing. Both show the header's hand-count badge (🤚5, 🤚7) not matching the number of visible cards — the last 1-3 cards are cut off at the *right* edge of the screen, not the bottom. The 2026-09-05 "sync `--app-height` to visualViewport" work (see the two entries above) was solving a real but different, unreported vertical bug; it never addressed this one. The actual root cause: CSS Grid items have `min-width: auto` by default, so a track can't shrink below its content's min-content size — on a hand with many cards (start-discard phases can reach 7-8 cards per player) or a narrow phone, the row silently became wider than the viewport with no scroll affordance, permanently hiding (and making unplayable) the overflow cards.
Rationale: `min-width: 0` on the grid items (tried first, see BACKLOG) fixes shrinking in principle, but an unconditional shrink-to-fit still means cards can shrink to illegibly/untappably small sizes with enough cards, or (if floored) reintroduces the exact same overflow for large hands. Computing the size in JS via `ResizeObserver` (rather than relying on CSS grid track auto-sizing, which is the same class of engine as the dvh bug and has its own iOS caching quirks) gives an explicit, testable number; flooring it at 44px (a standard minimum touch-target size) and falling back to horizontal scroll once that floor is hit guarantees every card stays visible *and* tappable, regardless of hand size or screen width.
Consequences: The hand row now scrolls horizontally in the rare 8+-card case instead of centering; verified the sizing formula in isolation (Node script) across hand sizes 1–12 and row widths 256–366px — no combination overflows without `overflowing: true` being set (which triggers the scroll fallback). Not yet verified on a real iOS device — none of this session's changes had been deployed (no commit past `031dc0d`, 2026-09-05 18:07) despite the user's friend already seeing a "worse" regression, implying an earlier turn deployed a preview build (`tranquil-woad.vercel.app`) directly via the Vercel CLI/MCP without a git commit. Going forward, land fixes via `git push` (auto-deploys per `docs/RUNBOOK.md`) so `git log` stays the source of truth for what's actually live.
Alternatives_Rejected: CSS-only `min-width: 0` with no floor — lets cards shrink to unusable sizes with big hands, and still trusts WebKit's live grid-track recompute exactly like the buggy `dvh` case. `min-width: 0` with a hard floor and no scroll fallback — reproduces the original overflow bug for 8+ card hands on narrow phones (confirmed by direct calculation before adding the scroll fallback).

---

## 2026-09-06 — Pre-fill the pseudo fields from the Bergamots hub's profile name

Decision: `App.tsx` reads a new `?name=` URL param the same way it already reads `?room=` for `lobbyInitialRoom`, and passes it to `Lobby.tsx` as a new `initialPlayerName` prop. `Lobby.tsx` uses it as the initial value of `myName` (bot/create/join) and `p1` (local pass-and-play, player 1 only — `p2` is untouched, since a second local player has no profile of their own on the same device). All four fields stay fully editable text inputs; nothing changed beyond their default value.
Context: Bergamots (the hub this app is launched from, `bergamots.vercel.app` / `muchogames.win`) added a player profile with a "Nom" field and wants that name to travel into every game it links to, including this one, without ever requiring an account here. Since this app runs on a different origin (`tranquil-woad.vercel.app`), Bergamots cannot read this app's storage or vice versa — the only channel is the launch URL, which Bergamots already uses for `?lang=`. See `bergamots/docs/TECH.md` "Player identity contract" and `bergamots/docs/DECISIONS.md` 2026-09-06.
Rationale: Reused the exact `?room=` pattern already in `App.tsx` (`useState` lazy initializer reading `URLSearchParams`) instead of introducing a new mechanism. Pre-filling default state rather than forcing the value keeps every existing behavior intact: a direct visit with no `?name=` still shows the same defaults as before (`'Player 1'` / empty), and a player can still type a different name for this particular game.
Consequences: No new state persistence, no schema/API change — `initialPlayerName` is only ever a prop default. A player arriving from the Bergamots hub with a profile name no longer has to retype it here for bot/online modes, and gets it pre-filled as Player 1 in local pass-and-play.
Alternatives_Rejected: Persisting the received name into this app's own storage for future visits — rejected, out of scope of what was asked (a pre-fill), and would introduce a second, potentially stale, source of truth for the name alongside Bergamots' own profile.

---

## 2026-09-06 — Hub avatar next to own name, online only

Decision: Online `GameBoard` shows the Bergamots hub `?avatar=` thumb (if present) as a small circle next to `{me.name} (you)`. Local pass-and-play and bot games do not receive the prop. The image is session-only (`sessionStorage`) and is not shown next to the opponent's name.
Context: Bergamots now forwards a tiny JPEG as `?avatar=` so the player can see their profile photo next to their name in online multiplayer. See bergamots `docs/DECISIONS.md` 2026-09-06 (tiny avatar thumb).
Rationale: Same launch-URL channel as `?name=`. Passing `selfAvatar` only on the `mode === 'online'` `GameBoard` is the smallest gate. No schema/API change.
Consequences: A direct visit with no `?avatar=` looks exactly as before. `docs/PRODUCT.md` / `docs/TECH.md` were not edited autonomously.
Alternatives_Rejected: Showing the photo in local/bot modes too — rejected, user asked for online only. Syncing avatars through game state so the opponent can see them — rejected, not asked for.

---

## 2026-09-17 — Win/loss counter, client-only, own `SettingsPanel`

Decision: Added `client/src/lib/matchResultStats.ts` (`getMatchResultStats()` / `recordMatchResult(won)`), backed by a new `localStorage` key (`tranquil-match-results`). `GameOver`'s existing mount-only effect (the one that already plays the win/lose sound) now also calls `recordMatchResult(won)` once per finished match. Displayed in the existing shared `SettingsPanel` (used by both `Lobby` and `GameBoard`), next to the sound toggle.
Context: Part of a cross-repo request (root `muchogames` + `coinchapp` + this app) to add wins/losses stats to every card game, including this one. User confirmed via an explicit question: stay client-only/per-browser (no accounts), this app shows its own stats in its own UI rather than trying to sync back to the Bergamots hub's `/profile` (a different origin — cannot reach this app's `localStorage`).
Rationale: Tranquil is cooperative (`winner: 'players' | 'game'` — every player at the table shares the same outcome), unlike the competitive coinchapp games, so there is no "my seat" ambiguity to resolve and no dedup key was needed: `GameOver` only ever mounts once per finished match (it is conditionally rendered, and a rematch/new game re-mounts it fresh), so its existing `useEffect(..., [])` was already the exact "fires once" hook the stat needed, with no page-refresh-mid-finished-screen risk since this app has no state-persistence-across-reload for a finished game (unlike coinchapp's local-mode service worker).
Consequences: No new dedup/session-storage plumbing needed, unlike the sibling coinchapp change. `docs/PRODUCT.md` is currently all "TBD" here, so no Out-of-Scope line needed updating (unlike the root repo and coinchapp, both of which had one).
Alternatives_Rejected: Per-player win/loss (impossible here — the game is cooperative, both players always share the same result). Syncing to the hub's `/profile` — rejected, different origin, no channel for it.

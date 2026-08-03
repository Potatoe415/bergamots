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

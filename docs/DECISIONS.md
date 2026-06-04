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

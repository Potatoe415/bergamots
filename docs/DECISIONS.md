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

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

## 2026-08-15 — Adopt agent-agnostic context architecture, retire sync-flow tooling

Decision: Adopted the `AGENTS.md`-centric context architecture (canonical protocol + thin routers `CLAUDE.md`/`GEMINI.md`/`.cursor/rules/000-router.mdc` + `STATE.md` + `docs/*`) for this existing project, and removed the manual multi-machine sync tooling (`Sync-Push.ps1`, `Sync-Pull.ps1`, their `.bat` launchers, and `SYNC-HISTORY.md`).
Context: The repo previously relied on ad-hoc reverse-engineering notes (`spectre_fonctionnel.md`, `spectre_technique.md`), a standalone Cursor rules file (`docs/ai/cursor.md`), and hand-rolled PowerShell scripts that pushed/pulled the repo across machines and logged a "files sent/received" counter to `SYNC-HISTORY.md`. Git plus a normal remote already provides sync; the counter file added noise without value.
Rationale: A single canonical protocol file with conditional loading (per `AGENTS.md` Startup Protocol) prevents drift across AI tools and keeps token usage low. Real product/tech knowledge from the old spec files was migrated into `docs/PRODUCT.md` and `docs/TECH.md` instead of being left as `TBD`, since this is an existing, non-empty project.
Consequences: `docs/PRODUCT.md` and `docs/TECH.md` are now frozen until the user authorises changes. Anyone syncing machines must use plain `git pull` / `git push` going forward; there is no more automated "last write wins by file timestamp" merge or sync log.
Alternatives_Rejected: Keeping the sync scripts alongside the new docs — rejected because the user explicitly asked to erase the old flow-measuring files, and duplicate sync mechanisms (git + custom scripts) invite drift. Keeping `spectre_*.md` as-is alongside `docs/PRODUCT.md`/`docs/TECH.md` — rejected to avoid two sources of truth.

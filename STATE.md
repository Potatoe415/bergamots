# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Context architecture bootstrapped on an existing codebase.
Current_Goal: Maintain and evolve the Bergamots game hub (vanilla JS multi-game hub, Vite-built, Firebase-hosted).
Last_Action: Bootstrapped `AGENTS.md`-centric context architecture; migrated `spectre_fonctionnel.md`/`spectre_technique.md`/`docs/ai/cursor.md` into `docs/PRODUCT.md`, `docs/TECH.md`, `docs/DATA_MODEL.md`; removed the old multi-machine sync scripts and their flow-counter log.
Next_Actions:
- Pick the first real item for `docs/BACKLOG.md` Now.
- Confirm with user whether to keep or delete `refactor.py` (one-off, already-applied migration script left at repo root).
- Decide on automated testing / error-handling conventions (see `docs/TECH.md` Open_Questions).

Open_Questions:
- Project_Name: Bergamots (confirmed from README/package.json)
- Target_Users: Confirmed in `docs/PRODUCT.md` (party-game groups, remote Yatzy players)
- Stack: Confirmed in `docs/TECH.md` (Vanilla JS + Vite, Firebase Hosting + Realtime DB for Yatzy)
- Deployment_Target: Firebase Hosting (confirmed via `firebase.json`)

Recent_Changes:
- 2026-08-15 Bootstrap: created `AGENTS.md` context architecture, populated `docs/*` from existing legacy docs.
- 2026-08-15 Cleanup: deleted `Sync-Push.ps1`, `Sync-Pull.ps1`, `Sync-Push.bat`, `Sync-Pull.bat`, `SYNC-HISTORY.md` (old cross-machine sync-flow tooling).
- 2026-08-15 Cleanup: deleted `spectre_fonctionnel.md`, `spectre_technique.md`, `docs/ai/cursor.md` (content migrated, now superseded).

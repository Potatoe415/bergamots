# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer fully migrated from Firebase to Vercel + Supabase (shared `multigames-db` project with `coinchapp`) and verified end-to-end in production. All info files (`docs/*`, `STATE.md`) audited and aligned with this reality; no remaining Firebase references outside historical decision/migration-note entries.
Current_Goal: Keep evolving the Bergamots game hub now that hosting is on Vercel and Yatzy is on Supabase.
Last_Action: Standardized every game on "splash screen: back button top-left, settings button top-right" (see `docs/DECISIONS.md` 2026-08-17 entry). Audited all internal games against Yatzy's reference implementation; most already complied (wordpack engine, Olé Mains, Cafards, Millionaire, Pyramide). Fixed the two real gaps: Black Stories (`public/games/blackstories/index.html`/`.css`/`.js`) now shows a "Commencer" splash screen before the first riddle and moved its language chips behind a new gear settings button; Dice Duel (`public/games/diceduel/index.html`/`style.css`/`js/main.js`) now has a back-to-hub link and a gear settings button on `#screen-home` that reveals the rules text (previously always visible, now tucked behind the panel). Also fixed the sibling `coinchapp` repo's Coinche/Bouilla hub tiles: added a missing top-left back-to-hub link on `app/page.tsx` and corrected `app/bouilla/page.tsx`'s existing back button (was linking to coinchapp's own home instead of the Bergamots hub); both now link to `https://bergamots.vercel.app/` via a new `backToHub` i18n key (`lib/client/i18n.tsx`). Verified with `node --check` on the edited `.js` files, `npm run build` in both `bergamots` and `coinchapp`, and `npm run lint` in `coinchapp` (only pre-existing warnings/error remain, none in the edited files).
Next_Actions:
- User to manually confirm Black Stories' new splash screen and settings-panel language chips, and Dice Duel's new back/settings buttons on the home screen, look right.
- User to manually confirm both coinchapp hub tiles (Coinche + Bouilla) now show a working top-left "back to hub" button that lands on `bergamots.vercel.app`.
- User to manually confirm, for each game family (wordpack, Black Stories, Olé Mains, Pyramide, Millionaire, Cafards, Yatzy, Coinche/Bouilla), that switching the hub's language flag then launching the game actually starts it in that language.
- User to manually check both new hub tiles (Coinche Mobile + Bouilla) still land on the right screen in `coinchapp`.
- User to manually test the 1v1 online flow (host + joiner tabs) to confirm both the sync-race fixes and the new remote-turn animations look right; report back if anything still looks off.
- User to delete/decommission the Firebase project (Hosting + Realtime Database) whenever ready — confirmed safe, no other game depends on it.
- Be aware Sync-Push/Pull use mtime-based conflict resolution, not real git merge — double-check important changes weren't silently overwritten after each sync.
- `GitHistory.txt` PULL entries only reach other machines once that computer next runs a Push — inherent limitation of the file-based sync approach (no server), flagged to user.
- Pick the first real item for `docs/BACKLOG.md` Now.
- Confirm with user whether to keep or delete `refactor.py` (one-off, already-applied migration script left at repo root).
- Decide on automated testing / error-handling conventions (see `docs/TECH.md` Open_Questions).
- Pre-existing, unrelated bug noticed: `eslint.config.mjs`'s browser-globals block (`files: ["apps/**/*.js", "shared/**/*.js"]`) doesn't match any real folder (games live under `public/games/**`, shared code under `public/shared/**`), so `npm run lint` reports hundreds of false-positive `no-undef` errors across the whole repo. Left untouched (out of scope for this migration); flagged for a future fix.

Open_Questions:
- Project_Name: Bergamots (confirmed from README/package.json)
- Target_Users: Confirmed in `docs/PRODUCT.md` (party-game groups, remote Yatzy players)
- Stack: Vanilla JS + Vite; Yatzy backed by Supabase Postgres via `api/yatsy/games/*` (see `docs/DATA_MODEL.md`, `docs/TECH.md`, both updated and confirmed).
- Deployment_Target: Vercel (confirmed live, `bergamots` project, Git-integration auto-deploy on push to `main`).

Recent_Changes:
- 2026-08-17 Standardized "splash screen: back top-left / settings top-right" across every game; fixed the real gaps (Black Stories, Dice Duel) plus coinchapp's Coinche/Bouilla back-to-hub links (see Last_Action).
- 2026-08-17 Yatzy: added full ES (Spanish) translation to `i18n.js`; removed in-splash language selector (language now driven solely by hub's `bergamots-lang`).
- 2026-08-17 Hub-chosen language (`bergamots-lang`) now seeds the starting language of every launched game (internal + `coinchapp`), overriding each game's own memory.
- 2026-08-17 Split the `coinchapp` hub tile into separate "Coinche Mobile" / "Bouilla" tiles, each launching straight into its own game.
- 2026-08-17 Added remote-turn dice-roll/score animations for Yatzy online 1v1, mirroring robot-turn visuals.

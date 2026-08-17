# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer fully migrated from Firebase to Vercel + Supabase (shared `multigames-db` project with `coinchapp`) and verified end-to-end in production. All info files (`docs/*`, `STATE.md`) audited and aligned with this reality; no remaining Firebase references outside historical decision/migration-note entries.
Current_Goal: Keep evolving the Bergamots game hub now that hosting is on Vercel and Yatzy is on Supabase.
Last_Action: Coinche/Bouilla hub tiles now open in the same tab instead of a new one, for a "continuity" feel when leaving the hub. Added a `"sameTab": true` field to the `coinche`/`bouilla` entries in `public/hub-config.json`, and `hub.js`'s `createTileNode()` now only sets `target="_blank"` for external launches when that flag is absent (`isExternalLaunch(game.launch) && !game.sameTab`). Easy Frog/Tranquil (the other two `external` tiles) keep opening in a new tab — unchanged, not requested. Verified with `node --check hub.js`, a JSON parse check on `hub-config.json`, and `npm run build`.
Next_Actions:
- User to confirm Coinche/Bouilla now load in the same tab (no popup) and that back-to-hub still works from there.
- User to confirm the hero banner now looks sharp on their Pixel 8 (and that "Game on!" placement/font style is to their taste).
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
- 2026-08-17 Coinche/Bouilla hub tiles now navigate in the same tab (`sameTab` flag in `hub-config.json`) instead of opening a new one, for launch continuity.
- 2026-08-17 Replaced hub hero banner with a proper high-res (4000x800) image and moved "Game on!" out of the image into HTML/CSS (`Caveat` font) to fix pixelation on high-DPI phones.
- 2026-08-17 Bumped Yatzy's `sw.js` `CACHE_NAME` (v11→v12) to fix a stale service-worker cache that broke the splash for returning users after recent `app.js`/`index.html`/`i18n.js` edits.
- 2026-08-17 Standardized "splash screen: back top-left / settings top-right" across every game; fixed the real gaps (Black Stories, Dice Duel) plus coinchapp's Coinche/Bouilla back-to-hub links.
- 2026-08-17 Yatzy: added full ES (Spanish) translation to `i18n.js`; removed in-splash language selector (language now driven solely by hub's `bergamots-lang`).

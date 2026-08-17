# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer fully migrated from Firebase to Vercel + Supabase (shared `multigames-db` project with `coinchapp`) and verified end-to-end in production. All info files (`docs/*`, `STATE.md`) audited and aligned with this reality; no remaining Firebase references outside historical decision/migration-note entries.
Current_Goal: Keep evolving the Bergamots game hub now that hosting is on Vercel and Yatzy is on Supabase.
Last_Action: Fixed the hub's hero banner looking pixelated on high-DPI phones (e.g. Google Pixel 8, DPR ~2.6). Root cause: `public/assets/banner-games-hub.jpg`/`-mobile.jpg` were only 1024x204px (the source used when the "Game on!" redesign was applied), forcing the browser to upscale ~2x on dense screens. User supplied a proper high-res source (`temp-design/assets/Gemini_Generated_Image_rb5adtrb5adtrb5a.jpg`, 4640x928, gitignored staging folder) without baked-in text; re-encoded both banner files at 4000x800 via ffmpeg (`-q:v 6`, ~540KB each) into `public/assets/`. Moved the "Game on!" title out of the image into real HTML/CSS: new `<h1 class="banner-title" data-id="hub-banner-title">` in `index.html`, centered absolutely over `.hub-header` in `hub.css`, styled with the new Google Font `Caveat` (added to the font `<link>`). Verified via CDP-driven browser emulation (412x915 viewport, DPR 2.625 = Pixel 8) that the image now downscales (no upscale) and the title stays centered without colliding with the lang-switcher flag.
Next_Actions:
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
- 2026-08-17 Replaced hub hero banner with a proper high-res (4000x800) image and moved "Game on!" out of the image into HTML/CSS (`Caveat` font) to fix pixelation on high-DPI phones.
- 2026-08-17 Bumped Yatzy's `sw.js` `CACHE_NAME` (v11→v12) to fix a stale service-worker cache that broke the splash for returning users after recent `app.js`/`index.html`/`i18n.js` edits.
- 2026-08-17 Standardized "splash screen: back top-left / settings top-right" across every game; fixed the real gaps (Black Stories, Dice Duel) plus coinchapp's Coinche/Bouilla back-to-hub links.
- 2026-08-17 Yatzy: added full ES (Spanish) translation to `i18n.js`; removed in-splash language selector (language now driven solely by hub's `bergamots-lang`).
- 2026-08-17 Hub-chosen language (`bergamots-lang`) now seeds the starting language of every launched game (internal + `coinchapp`), overriding each game's own memory.

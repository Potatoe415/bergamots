# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: Add viral sharing and PWA installation to increase retention and acquisition.
Last_Action: User asked to continue the `yatsy/app.js` split: extracted `public/games/yatsy/render.js` (`window.YATZY_RENDER.createRenderer(deps)`, the `render()` DOM-projection pipeline) and `public/games/yatsy/session.js` (`window.YATZY_SESSION.createSessionController(deps)`, matchmaking/session-sync) out of `app.js` (2204 → 1187 lines), using explicit `deps` objects (getters for the reassigned `CATEGORIES` arrays and the shared scoring-animation flag) since both blocks call back into `app.js`'s core game logic. `app.js` aliases the factories' returned functions to their original names so every existing call site kept working unchanged. Retested everything live in the browser per the user's request: solo + 2-player games, dice roll/lock, scoring, settings-panel rule toggle (rebuilds `CATEGORIES` mid-session — the main risk), emoji reactions, and the online create/join flow failing gracefully without local Supabase config. `npm run lint`/`format:check`/`build` all pass, warnings unchanged at 13. Committed and pushed to `origin/main`.
Next_Actions:
- Add visual tags (player count, duration, type) to Hub game tiles.
- Ask the tester to hard-refresh/reopen Yatzy once `yatzy-offline-v31` is live and re-test the triple-click.
- Verify Yatzy "Mode defaite" end-to-end with two real Supabase-backed online clients (only verified via forced local state so far).
- Confirm Yatzy Play Online: small avatar beside the name field and beside the local name on the score chip; solo/robot have neither.
- Confirm Coinche/Bouilla online GameRoom chip (not local/ad-hoc) after those apps are deployed.
- Confirm Tranquil online `GameBoard` (not local/bot) after that app is deployed.
- Ask whether PRODUCT/TECH should drop "avatar is Bergamots-only".
- Confirm `/profile` crop then saved file stays under 50 KB.
- Rotate `ADMIN_PASSWORD` and copy `SUPABASE_URL` to Preview.
- Decide what to do about the GitHub branch-protection rule.
- `public/games/yatsy/app.js` (1187 lines) still exceeds the 300-line limit; remainder is the core game engine (dice/turn/scoring/robot AI/defeat mode), see `docs/BACKLOG.md` Later for the proposed feature-based cut.

Open_Questions:
- `GET /api/yatsy/games/[code]` is still unauthenticated.
- Room codes stay at 3 letters by user decision.
- A player who loses their `localStorage` can no longer re-enter a game in progress.
- Retention: `muchogames_events` is append-only with no purge job.
- Rename: only `muchogames_events` uses the new name.
- Whether to raise `printWidth` from 80 to 100.
- Whether PRODUCT should stay "max 3 rolls" given the online joke extra roll.

Known_Issues (pre-existing, flagged by the audit, tracked in `docs/BACKLOG.md`):
- `public/games/**` (except `yatsy`, already un-ignored) is excluded from `format:check` on purpose.
- `public/assets/banner-games-hub-mobile.jpg` is byte-identical to the desktop banner.
- `shared/js/engine.js` and `public/shared/js/engine.js` are duplicated (deliberately, JSDoc-only diff — see `docs/BACKLOG.md`).
- `npm run build` only bundles `index.html` + `wordplayer.html`.
- No automated tests.
- `public/games/yatsy/app.js` is still 1187 lines against the 300-line project limit; `storage.js`, `render.js`, and `session.js` have been split out so far, remainder is the core game engine.

Recent_Changes:
- 2026-09-09 Yatzy: extracted `render.js` (DOM projection) and `session.js` (matchmaking/session-sync) out of `app.js` (2204 → 1187 lines); retested live in browser, committed and pushed.
- 2026-09-09 Viral sharing: Added Web Share API buttons on the Hub header and styled the Yatzy share button in WhatsApp green with a better prompt text.
- 2026-09-09 Yatzy: GIF picker iOS Safari fix — `.gif-option` gets `display:block; height:4.4rem` so `object-fit:cover` on the `<img>` works; added `-webkit-overflow-scrolling:touch` on the grid.
- 2026-09-09 Yatzy: bumped the offline service worker's `CACHE_NAME` to `yatzy-offline-v31` so returning players actually receive the "Mode defaite" `app.js` instead of a stale cached copy.
- 2026-09-09 Deleted ≈16.9 MB of previously-flagged dead weight (old1/2/3.jpg, banner-games-hub-old.jpg, Millionaire's unused questions_{en,es,fr}.json, easyfrog's unused style.css, both dead dom.js copies).

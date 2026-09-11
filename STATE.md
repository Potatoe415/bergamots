# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: Add viral sharing and PWA installation to increase retention and acquisition.
Last_Action: Yatzy GIF picker still looked squashed on iPhone (Safari + Chrome, both WebKit) after the previous fix. Root cause: `.gif-option img { height: 100% }` relies on percentage-height resolution through a `<button>` ancestor, which WebKit doesn't reliably propagate — the image fell back to its intrinsic aspect ratio (auto height) instead of filling the 4.4rem cell, so landscape GIFs rendered short/"squashed" with background showing below. Fixed by giving the `<img>` a fixed `height: 4.4rem` (matching `.gif-option`) instead of a percentage. Also bumped `sw.js` cache to `yatzy-offline-v33` so returning PWA users actually get the new CSS instead of the service worker's cached copy. Not yet committed/pushed — awaiting instruction.
Next_Actions:
- Commit and push the GIF picker squash fix (`styles.css` + `sw.js` v33) once confirmed working on a real iPhone.
- Commit and push the Président tile + coinche launch-URL fix once confirmed.
- Add visual tags (player count, duration, type) to Hub game tiles.
- Ask the tester to hard-refresh/reopen Yatzy once `yatzy-offline-v33` is live and re-test the triple-click (with the new checkbox left at its default ON).
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
- 2026-09-11 Yatzy: GIF picker was still squashed on iPhone after the 09-09 fix — real cause was `height:100%` not resolving through a `<button>` ancestor in WebKit; switched `.gif-option img` to a fixed `height:4.4rem`, bumped `sw.js` to `yatzy-offline-v33`.
- 2026-09-10 Hub: added the "Président" tile (3rd coinchapp game) and fixed `coinche`'s launch URL, which was silently landing on coinchapp's new home game-picker instead of Coinche's own splash.
- 2026-09-09 Yatzy: added a "Mode defaite" settings checkbox (default ON) gating the triple-click defeat-mode feature; bumped `sw.js` cache to `yatzy-offline-v32`.
- 2026-09-09 Yatzy: extracted `render.js` (DOM projection) and `session.js` (matchmaking/session-sync) out of `app.js` (2204 → 1187 lines); retested live in browser, committed and pushed.
- 2026-09-09 Viral sharing: Added Web Share API buttons on the Hub header and styled the Yatzy share button in WhatsApp green with a better prompt text.

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: Add viral sharing and PWA installation to increase retention and acquisition.
Last_Action: Ran a modularity/duplication/doc-freshness audit at the user's request. Deleted the ≈16.9 MB of dead weight the 2026-08-30 audit had flagged but left for manual review (old1/2/3.jpg, banner-games-hub-old.jpg, Millionaire's unused root-level `questions_{en,es,fr}.json`, easyfrog's unused style.css, the two dead byte-identical `dom.js` copies) after re-confirming zero references. Extracted `public/games/yatsy/storage.js` (`window.YATZY_STORAGE`, raw localStorage primitives) out of `app.js` (2267 → 2204 lines) as the first increment of the long-standing "split the oversized modules" backlog item; verified live in the browser (solo game, dice roll, settings toggle) plus `npm run lint`/`format:check`/`build`. Corrected a stale number found along the way: `docs/BACKLOG.md` still said `yatsy/app.js` was 1759 lines (2026-08-30 audit); it had actually grown to 2267.
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
- Continue splitting `public/games/yatsy/app.js` (still 2204 lines): rendering and online-sync/session-handler blocks are next, see `docs/BACKLOG.md` Later.

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
- `public/games/yatsy/app.js` is still 2204 lines against the 300-line project limit; only the localStorage layer has been split out so far.

Recent_Changes:
- 2026-09-09 Viral sharing: Added Web Share API buttons on the Hub header and styled the Yatzy share button in WhatsApp green with a better prompt text.
- 2026-09-09 Yatzy: GIF picker iOS Safari fix — `.gif-option` gets `display:block; height:4.4rem` so `object-fit:cover` on the `<img>` works; added `-webkit-overflow-scrolling:touch` on the grid.
- 2026-09-09 Yatzy: bumped the offline service worker's `CACHE_NAME` to `yatzy-offline-v31` so returning players actually receive the "Mode defaite" `app.js` instead of a stale cached copy.
- 2026-09-09 Deleted ≈16.9 MB of previously-flagged dead weight (old1/2/3.jpg, banner-games-hub-old.jpg, Millionaire's unused questions_{en,es,fr}.json, easyfrog's unused style.css, both dead dom.js copies).
- 2026-09-09 Extracted `public/games/yatsy/storage.js` (localStorage primitives) out of `app.js` (2267 → 2204 lines), first increment of the oversized-module split.

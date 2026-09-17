# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: V2 of the "refonte" is now in progress: `coinchapp` and `tranquil` colocated into this repo under `apps/` (Git history preserved via `git subtree`), deployment cutover in progress for `coinchapp`. Turborepo now orchestrates root+`coinchapp` build/lint. Also still: add viral sharing and PWA installation to increase retention/acquisition.
Last_Action: Adopted Turborepo (not pnpm — `apps/tranquil`'s own nested npm workspaces can't nest inside pnpm/npm's outer workspace, so switching package managers now was judged too risky mid-migration). Added `turbo.json` + root `"workspaces": ["apps/coinchapp"]`; `npm run build:all`/`lint:all` now cache-orchestrate the hub + `coinchapp`. Verified: full root `npm run check` still passes, `coinchapp` builds/caches via turbo, `tranquil` still builds standalone (untouched, deliberately excluded). Found (flagged, not fixed) one pre-existing lint error in `coinchapp`'s own code via the new `lint:all`. Updated `docs/TECH.md`, `docs/GAMES_MAP.md`, `docs/DECISIONS.md`, `docs/BACKLOG.md`. Not yet committed/pushed.
Next_Actions:
- Commit and push the Turborepo setup (`turbo.json`, `package.json`, `.gitignore`, doc updates).
- User: add `GIPHY_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` manually to `coinchapp-monorepo` (Production + Preview) on Vercel, then say so.
- Agent: once added, trigger a fresh deployment, verify the Supabase/Giphy-backed flows live, then move the `coinchapp.vercel.app` domain from the old project to `coinchapp-monorepo`.
- Then repeat the same Vercel repoint for `tranquil` (`prj_FnorlK5RzjApMxvvVAXIhEvlxBdF`) — not started.
- Rotate the Vercel token pasted in chat earlier, once the whole migration is done.
- Archive both original GitHub repos (`coinchapp`, `tranquil`) only after both Vercel repoints are verified live.
- Optional, on request: author a `NOTES.md` for each already-oversized game (`millionaire`, `pyramide`, `yatsy`, `diceduel`) — deliberately skipped this pass since the ask was forward-looking.
- Commit and push the "La Bataille Corse" Hub tile once confirmed visually (tile art, position next to Président, launch works with name/avatar params).
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
- `npm run build` only bundles `index.html` + `wordplayer.html`.
- No automated tests.
- `public/games/yatsy/app.js` is still 1187 lines against the 300-line project limit; `storage.js`, `render.js`, and `session.js` have been split out so far, remainder is the core game engine.

Recent_Changes:
- 2026-09-17 Adopted Turborepo (npm workspaces, `apps/coinchapp` only) for cached build/lint orchestration; `apps/tranquil` excluded (nested npm workspaces conflict). Surfaced one pre-existing coinchapp lint error, flagged not fixed.
- 2026-09-17 `coinchapp-monorepo` Vercel repoint progressing via a user-provided full-access token: Root Directory + 2/4 env vars confirmed, `/` and `/coinche` verified 200. 2 "sensitive"-type vars still need the user to re-enter them manually.
- 2026-09-17 Colocated `coinchapp` + `tranquil` into `apps/` via `git subtree` (history preserved), excluded `apps/**` from root lint/format, verified both still build standalone. Deployment untouched.
- 2026-09-17 Committed and pushed (`eca4c95`): deduplicated `engine.js`, added `shared/CONTRACT.md`, `docs/GAMES_MAP.md`, `docs/NEW_GAME.md`.
- 2026-09-16 Hub: added the "La Bataille Corse" tile (4th coinchapp game), pinned right after "Président" in `PINNED_GAME_IDS` and `hub-config.json`, with a new generated thumbnail.
- 2026-09-11 Yatzy: GIF picker was still squashed on iPhone after the 09-09 fix — real cause was `height:100%` not resolving through a `<button>` ancestor in WebKit; switched `.gif-option img` to a fixed `height:4.4rem`, bumped `sw.js` to `yatzy-offline-v33`.

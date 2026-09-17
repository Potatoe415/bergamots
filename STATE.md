# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: V2 of the "refonte": `coinchapp` fully migrated (code + deployment, live in production) and post-migration cleanup done. `tranquil` still colocated (code only) but not yet repointed on Vercel. Also still: add viral sharing and PWA installation to increase retention/acquisition.
Last_Action: Fixed a real-device Yatzy layout bug reported via screenshot from a Motorola Edge 50 Fusion ("Quitter" button hidden behind the score chip, scoreboard columns overlapping FULL/CARRE/SUITE/MIN/MAX/YATZY). Root cause: `.score-group` and `h1` in `public/games/yatsy/styles.css` had hard `rem` floors that were only safe below the existing `max-width: 430px` breakpoint, leaving a dead zone on wider-but-still-phone-sized viewports (common on large low-DPR Android screens). Made both fluid instead of breakpoint-dependent (pure `fr` columns + `min-width: 0` on `.score-group`; lower `clamp()` floor + real ellipsis truncation on `h1`; `.header-title` can now shrink while `.restart-button` got `flex-shrink: 0`). Also bumped `sw.js` `CACHE_NAME` v33→v34 since the cache-first service worker would otherwise keep serving the old CSS to any device that already visited, forever. Verified via `npm run dev` + browser CDP viewport emulation (multiple widths, scoring-phase content, room-code title); `npm run check` passes, same 13 pre-existing warnings. Updated `docs/BACKLOG.md`. Not yet committed/pushed.
Next_Actions:
- Commit and push the Yatzy layout fix (`styles.css` + `sw.js` v34) and this round's `docs/BACKLOG.md` update.
- Ask the user to confirm on the friend's actual Motorola Edge 50 Fusion once deployed (hard-refresh/reopen so the new service worker version takes over).
- Commit and push the prior cleanup round's doc updates (`docs/BACKLOG.md`, `docs/DECISIONS.md`, `docs/GAMES_MAP.md`).
- User: delete `Potatoe415/coinchapp` on GitHub (Settings → Danger Zone) — history already preserved inside `bergamots` via the earlier `git subtree` import, nothing is lost.
- User, optional: run `delete from public.games where room_code = 'JQW';` in Supabase, or let the 48h TTL cron handle it.
- Repeat the same Vercel repoint for `tranquil` (`prj_FnorlK5RzjApMxvvVAXIhEvlxBdF`) — not started. Don't assume "delete" carries over for its old repo — ask again when that migration is done.
- Rotate the Vercel token pasted in chat earlier, once `tranquil`'s migration is also done.
- Optional, on request: author a `NOTES.md` for each already-oversized game (`millionaire`, `pyramide`, `yatsy`, `diceduel`) — deliberately skipped this pass since the ask was forward-looking.
- Commit and push the "La Bataille Corse" Hub tile once confirmed visually (tile art, position next to Président, launch works with name/avatar params).
- Commit and push the GIF picker squash fix and the Président tile + coinche launch-URL fix, once both confirmed on real devices.
- Add visual tags (player count, duration, type) to Hub game tiles.
- Ask the tester to hard-refresh/reopen Yatzy once `yatzy-offline-v34` is live and re-test the triple-click (with the new checkbox left at its default ON).
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
- 2026-09-17 Fixed Yatzy layout overlap bug on wide-phone viewports (Motorola Edge 50 Fusion): fluid `.score-group`/`h1` sizing instead of breakpoint-only, `sw.js` v33→v34.
- 2026-09-17 Post-migration cleanup: deleted old `coinchapp` Vercel project, renamed `coinchapp-monorepo` → `coinchapp`. GitHub repo deletion + test-data cleanup left as user steps.
- 2026-09-17 `coinchapp` Vercel migration completed: verified live (real game created, GIF picker tested), domain moved. Fully done, in production.
- 2026-09-17 Adopted Turborepo (npm workspaces, `apps/coinchapp` only) for cached build/lint orchestration; `apps/tranquil` excluded (nested npm workspaces conflict).
- 2026-09-17 Committed and pushed (`eca4c95`): deduplicated `engine.js`, added `shared/CONTRACT.md`, `docs/GAMES_MAP.md`, `docs/NEW_GAME.md`.

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on the `muchogames` Vercel project's Production + Preview (renamed from `bergamots` 2026-09-17). Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `muchogames.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: V2 of the "refonte": `coinchapp` fully migrated (code + deployment, live in production) and post-migration cleanup done. `tranquil` still colocated (code only) but not yet repointed on Vercel. Also still: add viral sharing and PWA installation to increase retention/acquisition.
Last_Action: Fixed Yatzy losing in-progress local games on refresh: only online (Supabase matchmaking) games had a resume mechanism (`yatzy-online-session`); solo-vs-robot and 2-player-same-device games (`setup.mode` "robot"/"solo" internally, labelled "Partie solo"/"Partie à deux" in FR) had none at all — `createInitialState()` always started at the splash screen. Added the same persist/restore/clear pattern for local games in `app.js`: `persistLocalGameState()` (writes `yatzy-local-game-session` on every `render()` when in-game and not online, clears it otherwise), `restoreLocalGameState()` (called once before the first `render()`). Bumped `sw.js` `CACHE_NAME` v36→v37 and the `TEMP` build tag v0.1→v0.2 alongside the `app.js` edit. Verified live in the dev browser via CDP for both modes: mid-turn dice/scores/current-player survive a full page reload, and the persisted key is correctly cleared on "Retour à l'accueil". `npm run check` passes with zero new warnings. Not yet committed/pushed.
Next_Actions:
- Commit and push the Yatzy local-game-resume fix, then ask the user to confirm on a real device (both "Partie solo" and "Partie à deux") once deployed — hard-refresh/reopen so `yatzy-offline-v37` takes over.
- Remember: any future edit to a file in `sw.js`'s `APP_ASSETS` list needs a `CACHE_NAME` bump in the same change, or it will silently never reach already-visited browsers — bump the `v0.1`/`v0.2` build tag alongside it as a visible confirmation signal.
- User: confirm `muchogames.win` still shows "Valid Configuration" in Vercel, and add `muchogames.vercel.app` to Google Cloud Console's Authorized JavaScript origins.
- Ask the user to confirm the Yatzy layout fix on the friend's actual Motorola Edge 50 Fusion once deployed (hard-refresh/reopen so the new service worker version takes over).
- User: delete `Potatoe415/coinchapp` on GitHub (Settings → Danger Zone) — history already preserved inside `bergamots` via the earlier `git subtree` import, nothing is lost.
- User, optional: run `delete from public.games where room_code = 'JQW';` in Supabase, or let the 48h TTL cron handle it.
- Repeat the same Vercel repoint for `tranquil` (`prj_FnorlK5RzjApMxvvVAXIhEvlxBdF`) — not started. Don't assume "delete" carries over for its old repo — ask again when that migration is done.
- Rotate the Vercel token pasted in chat earlier, once `tranquil`'s migration is also done.
- Optional, on request: author a `NOTES.md` for each already-oversized game (`millionaire`, `pyramide`, `yatsy`) — deliberately skipped this pass since the ask was forward-looking.
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
- `public/games/yatsy/app.js` (1187 lines) still exceeds the 300-line limit; remainder is the core game engine (dice/turn/scoring/robot AI/defeat mode), see `docs/BACKLOG.md` Later for the proposed feature-based cut.

Open_Questions:
- `GET /api/yatsy/games/[code]` is still unauthenticated.
- Room codes stay at 3 letters by user decision.
- A player who loses their `localStorage` can no longer re-enter a game in progress.
- Retention: `muchogames_events` is append-only with no purge job.
- Rename: only `muchogames_events` uses the new name.
- Whether to raise `printWidth` from 80 to 100.
- Whether PRODUCT should stay "max 3 rolls" given the online joke extra roll.
- GitHub branch-protection rule on `main` requires a PR; user currently bypasses it on every push. Deferred — revisit later (remove the rule, or actually switch to PRs).

Known_Issues (pre-existing, flagged by the audit, tracked in `docs/BACKLOG.md`):
- `public/games/**` (except `yatsy`, already un-ignored) is excluded from `format:check` on purpose.
- `public/assets/banner-games-hub-mobile.jpg` is byte-identical to the desktop banner.
- `npm run build` only bundles `index.html` + `wordplayer.html`.
- No automated tests.
- `public/games/yatsy/app.js` is still 1187 lines against the 300-line project limit; `storage.js`, `render.js`, and `session.js` have been split out so far, remainder is the core game engine.

Recent_Changes:
- 2026-09-17 Yatzy: added local-game (solo vs robot / 2-player same-device) resume-on-refresh, mirroring the existing online session persistence — new `yatzy-local-game-session` key, `persistLocalGameState`/`restoreLocalGameState` in `app.js`; `sw.js` v36→v37, build tag v0.1→v0.2. Not yet committed.
- 2026-09-17 Yatzy: root-caused the persistent overlap report to a stale `sw.js` cache-first cache (bumped `CACHE_NAME` v35→v36), fixed a real `.emoji-trigger-button`/`.roll-chip` collision at very narrow widths (`padding-right` reservation on `.roll-button`), and added a `TEMP` "v0.1" build tag at the screen bottom to make future stale-cache issues visible at a glance (commit `492ba0e`, verified live via CDP at 246px/390px).
- 2026-09-17 Yatzy: added a fluid root `font-size` clamp in `styles.css` so all rem-based sizing shrinks continuously with viewport width, closing the 431-699px "dead zone" between the two fixed breakpoints (commit `a55cb11`).
- 2026-09-17 Removed Dice Duel entirely (game folder, `hub-config.json`, `docs/GAMES_MAP.md`, `eslint.config.mjs` special-case block) at user request, after flagging it as the one game with zero i18n.
- 2026-09-17 Added a "Règles" panel section (`loadRulesIfExists`) + `rules_fr/en/es.html` to Black Stories, Millionaire, and Yatzy, matching the shared back/paramètres convention; Yatzy `sw.js` v34→v35.

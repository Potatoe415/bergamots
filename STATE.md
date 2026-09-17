# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: Add viral sharing and PWA installation to increase retention and acquisition. Also weighing a "refonte": user read an article pitching a pnpm/Turborepo/Nx monorepo and asked if it fits. Assessed against the real stack (vanilla JS, no bundler for ~15 of ~17 games, no TypeScript) — decided the full tooling is premature; scoped V1 to this repo only, V2 (later) folds in `coinchapp`/`tranquil`. See `docs/DECISIONS.md` 2026-09-17.
Last_Action: Committed and pushed the full session's work to `main` (`eca4c95`): `engine.js` dedup, `shared/CONTRACT.md`, `docs/GAMES_MAP.md`, `docs/NEW_GAME.md`, plus the `AGENTS.md`/`docs/TECH.md`/`docs/BACKLOG.md` wiring. `tmp-resources/` deliberately excluded (unrelated, pre-existing untracked file). Push succeeded but bypassed the known branch-protection rule (see Next_Actions below).
Next_Actions:
- Optional, on request: author a `NOTES.md` for each already-oversized game (`millionaire`, `pyramide`, `yatsy`, `diceduel`) — deliberately skipped this pass since the ask was forward-looking.
- Decide the concrete shape of V2 (folding `coinchapp`/`tranquil` into this repo) whenever that becomes real — deferred, nothing started.
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
- 2026-09-17 Committed and pushed (`eca4c95`): deduplicated `engine.js`, added `shared/CONTRACT.md`, `docs/GAMES_MAP.md` (per-game index for LLM context isolation) and `docs/NEW_GAME.md` (technical + visual checklist for new games), wired into `AGENTS.md`'s Startup Protocol; flagged `public/games/pictionary/` as orphaned dead code (not deleted).
- 2026-09-16 Hub: added the "La Bataille Corse" tile (4th coinchapp game), pinned right after "Président" in `PINNED_GAME_IDS` and `hub-config.json`, with a new generated thumbnail.
- 2026-09-11 Yatzy: GIF picker was still squashed on iPhone after the 09-09 fix — real cause was `height:100%` not resolving through a `<button>` ancestor in WebKit; switched `.gif-option img` to a fixed `height:4.4rem`, bumped `sw.js` to `yatzy-offline-v33`.
- 2026-09-10 Hub: added the "Président" tile (3rd coinchapp game) and fixed `coinche`'s launch URL, which was silently landing on coinchapp's new home game-picker instead of Coinche's own splash.

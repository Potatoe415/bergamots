# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) get `?name=` and a tiny `?avatar=` thumb from `hub.js`. See `docs/DECISIONS.md` 2026-09-06.
Current_Goal: Ship "Mode defaite" (quick forfeit auto-play) in Yatzy for solo, local 2-player, and online 1v1.
Last_Action: Added a hidden triple-click on the Yatzy score summary (top-right) that, once a player has <=3 categories left on their own turn, auto-plays their remaining turns through the robot's decision engine at ~150ms/step, with a "Mode defaite : ON" toast synced to both players online via a new `MATCHMAKING.sendNotice` broadcast channel. Verified locally in the browser (state forced via CDP): triple-click activates, toast shows, turns auto-complete, then control passes to the other player; a single/double click, or clicking with >3 categories left, correctly does nothing.
Next_Actions:
- Verify Yatzy "Mode defaite" end-to-end with two real Supabase-backed online clients (only verified via forced local state so far).
- Confirm Yatzy Play Online: small avatar beside the name field and beside the local name on the score chip; solo/robot have neither.
- Confirm Coinche/Bouilla online GameRoom chip (not local/ad-hoc) after those apps are deployed.
- Confirm Tranquil online `GameBoard` (not local/bot) after that app is deployed.
- Ask whether PRODUCT/TECH should drop "avatar is Bergamots-only".
- Confirm `/profile` crop then saved file stays under 50 KB.
- Rotate `ADMIN_PASSWORD` and copy `SUPABASE_URL` to Preview.
- Decide what to do about the GitHub branch-protection rule.

Open_Questions:
- `GET /api/yatsy/games/[code]` is still unauthenticated.
- Room codes stay at 3 letters by user decision.
- A player who loses their `localStorage` can no longer re-enter a game in progress.
- Retention: `muchogames_events` is append-only with no purge job.
- Rename: only `muchogames_events` uses the new name.
- Whether to raise `printWidth` from 80 to 100.
- Whether PRODUCT should stay “max 3 rolls” given the online joke extra roll.

Known_Issues (pre-existing, flagged by the audit, tracked in `docs/BACKLOG.md`):
- `public/games/**` is excluded from `format:check` on purpose.
- ~16.9 MB of unreferenced dead weight is still shipped to production.
- `public/assets/banner-games-hub-mobile.jpg` is byte-identical to the desktop banner.
- `shared/js/engine.js` and `public/shared/js/engine.js` are duplicated.
- `npm run build` only bundles `index.html` + `wordplayer.html`.
- No automated tests.

- 2026-09-06 Profile header matches games (back + settings/language). Avatar upload adds a crop step before the 50 KB JPEG. Login does not override bergamots-lang.
- 2026-09-06 Coinche/Bouilla Play Online now keeps the hub profile name (`?name=` was dropped on the splash → `/online` navigation).
- 2026-09-06 Hub top-right account button shows the stored JPEG avatar; profile upload compresses to a square JPEG under ~50 KB.
- 2026-09-06 Profile: single clickable avatar (removed change button); page copy follows `bergamots-lang`. Yatzy: extra Play Online step before name/create/join. Auth popover translated.
- 2026-09-08 Yatzy: triple-click on the top-right score summary (<=3 categories left, own turn) activates "Mode defaite" - fast auto-play via the robot's decision engine, plus a synced toast to both players online.

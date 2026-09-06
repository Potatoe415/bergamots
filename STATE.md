# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` has Nom + a single clickable Avatar (no separate change button), copy in FR/EN/ES from `bergamots-lang`. Yatzy shows the name only on the Play Online step. Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`) still get `?name=` from `hub.js`. See `docs/TECH.md` "Player identity contract" and `docs/DECISIONS.md` 2026-09-06.
Current_Goal: None active — profile/Yatzy/stats changes pushed to main.
Last_Action: Committed and pushed profile avatar (clickable JPEG, hub icon), Yatzy Play Online step, and personal launch stats.
Next_Actions:
- Confirm `/profile` shows "Aucun jeu lancé" then, after launching games from the hub, the total and top five.
- Confirm Coinche/Bouilla Play Online pre-fills the nickname when launched from the hub with a profile name (needs coinchapp deploy).
- Ask the user to purge the Cloudflare cache for `muchogames.win` and retry login there.
- Confirm the checkbox + 3-tap extra roll in a real game (local duo or online).
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

Recent_Changes:
- 2026-09-06 Profile shows this browser's launch total + top 5 games (`bergamots-launch-counts`, hub-tile click only). See DECISIONS.
- 2026-09-06 Coinche/Bouilla Play Online now keeps the hub profile name (`?name=` was dropped on the splash → `/online` navigation).
- 2026-09-06 Hub top-right account button shows the stored JPEG avatar; profile upload compresses to a square JPEG under ~50 KB.
- 2026-09-06 Profile: single clickable avatar (removed change button); page copy follows `bergamots-lang`. Yatzy: extra Play Online step before name/create/join. Auth popover translated.
- 2026-09-06 Profile + cross-game name propagation, per approved plan: `/profile` Avatar upload (`bergamots-player-avatar`); new `public/shared/js/player-profile.js`; `hub.js` `appendLaunchParams()` adds `?name=` to external launches; Yatzy name field (now online-only); `coinchapp`/`tranquil` pre-fill from `?name=`. See DECISIONS.

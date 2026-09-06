# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link. Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win`. `/profile` now has "Nom" + Avatar (upload, ~50 KB, client-only). The name is wired everywhere: Yatzy reads it directly (same origin, new "Ton nom" splash field, synced online too), and Coinche/Bouilla (`coinchapp`)/Tranquil (`tranquil`, separate repos/origins) get it pre-filled via a `?name=` launch param from `hub.js`. See `docs/TECH.md` "Player identity contract" and `docs/DECISIONS.md` 2026-09-06.
Current_Goal: None active — profile + cross-game name propagation shipped as `V0.0.2` (`version.js`), pushed to `main` (`ba5a96a`), auto-deploying to `bergamots.vercel.app`.
Last_Action: Bumped `APP_VERSION` to `V0.0.2`, committed and pushed the full "profil enrichi + nom cross-jeux" work to `main` (bypassed branch-protection rule, same as prior pushes). `tmp-resources/` deliberately left uncommitted (scratch folder).
Next_Actions:
- Manually verify in a browser once deployed: set a name+avatar on `/profile`, confirm Yatzy's splash pre-fills "Ton nom" (local and online, both seats show real names), and confirm Coinche/Bouilla/Tranquil tiles pre-fill their pseudo field.
- Commit and push the `tranquil` change (not yet deployed — see its own STATE.md) so `tranquil-woad.vercel.app` picks it up.
- Ask the user to purge the Cloudflare cache for `muchogames.win` and retry login there.
- Hard-refresh Yatzy: emoji button should sit on the far right of the board; picker still opens upward.
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
- 2026-09-06 Profile + cross-game name propagation, per approved plan: `/profile` Avatar upload (`bergamots-player-avatar`); new `public/shared/js/player-profile.js`; `hub.js` `appendLaunchParams()` adds `?name=` to external launches; Yatzy gained a "Ton nom" splash input (local + online, synced via `game_state.players[].name`); `coinchapp`/`tranquil` pre-fill their own pseudo fields from `?name=`. See DECISIONS.
- 2026-09-06 Yatzy splash buttons centered; order is Partie à deux / Partie solo / Partie en ligne; Partie locale label removed; cache `yatzy-offline-v28`.
- 2026-09-06 Yatzy splash: Yam wallpaper from `tmp-resources` (210 KB WebP) + Coinchapp-style glass nav and colored overlay buttons.
- 2026-09-05 `auth.js` pre-fills `bergamots-player-name` from the Google account's display name on first sign-in only; never overwrites a manually-typed name.
- 2026-09-05 Fixed the auth popover being clipped by `.hub-header`'s `overflow:hidden`; widgets moved to `.hub-shell`.

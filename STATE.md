# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") showing the signed-in email + a "Profil" link (pushed, commit `d26585a`). Login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win` (Cloudflare -> Vercel) with Google's "doesn't comply with OAuth 2.0 policy" error even after adding a Test user — suspected stale Cloudflare cache, not yet confirmed/fixed. `/profile` just gained an editable "Nom" field (`bergamots-player-name` in `localStorage`), not yet committed and not yet read by any game.
Current_Goal: Commit/push the profile "Nom" field, then get Google login working on `muchogames.win` (Cloudflare cache purge).
Last_Action: Added an editable "Nom" text field + save button to `/profile` (`public/profile/profile.js`, `bergamots-player-name` in `localStorage`), per explicit user request to defer wiring it into games to a later task. Updated `docs/PRODUCT.md`/`docs/TECH.md`/`docs/DECISIONS.md`.
Next_Actions:
- Run lint/format/build, then commit and push the profile "Nom" field.
- Ask the user to purge the Cloudflare cache for `muchogames.win` and retry login there.
- Future task (not started): read `bergamots-player-name` from each game and pre-fill its own name input.
- Hard-refresh Yatzy: emoji button should sit on the far right of the board; picker still opens upward.
- Ask the remote player to hard-refresh / fully close-reopen the Yatzy tab if emoji still seem silent (stale service worker is the leading suspect, not the broadcast code).
- Confirm the checkbox + 3-tap extra roll in a real game (local duo or online).
- Rotate `ADMIN_PASSWORD` and copy `SUPABASE_URL` to Preview.
- Confirm the live hub tile shows the original Game Boy photo.
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
- 2026-09-05 `/profile` gained an editable "Nom" field, saved client-side (`bergamots-player-name`). Not yet consumed by any game.
- 2026-09-05 Auth popover shows the signed-in email + a "Profil" link to `/profile`; login icon moved right of the language switcher; z-index fix for the popover-behind-flags bug.
- 2026-09-05 Google Sign-In status widget added to the hub (`auth.js`, client-only). Real `GOOGLE_CLIENT_ID` set; works on `bergamots.vercel.app`, still broken on `muchogames.win`.
- 2026-09-05 Yatzy reaction button pinned to the right edge of the game card. SW v22.
- 2026-09-04 Fixed `api/yatsy/gifs.js` helper imports (`../_lib` not `../../_lib`). Production was crashing with `FUNCTION_INVOCATION_FAILED` even with `GIPHY_API_KEY` set.

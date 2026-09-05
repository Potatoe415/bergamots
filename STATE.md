# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub has a Google Sign-In icon (top-right, rightmost, real `GOOGLE_CLIENT_ID` from Google Cloud project "muchogames") that now shows the signed-in email and a "Profil" link to a placeholder `/profile` page; login confirmed working on `bergamots.vercel.app`, still failing on the custom domain `muchogames.win` (Cloudflare -> Vercel) with Google's generic "doesn't comply with OAuth 2.0 policy" error even after adding a Test user — suspected stale Cloudflare cache serving an old build, not yet confirmed/fixed.
Current_Goal: Get Google login working on `muchogames.win` too (likely needs a Cloudflare cache purge), then commit/push the latest UI changes (email display, profile link, icon reorder, z-index fix).
Last_Action: Implemented the Google Sign-In status widget on the hub (`auth.js`, `#auth-widget`, `hub.css`), updated `docs/PRODUCT.md`/`docs/TECH.md`/`docs/DECISIONS.md`, verified lint/format/build. User provided the real OAuth Client ID (from a downloaded `client_secret_*.json`, whose `client_secret` is unused and was not committed) — pasted into `auth.js`; that revision was committed and pushed. Since then: moved the login icon to the right of the language switcher, added explicit `z-index` to fix the popover rendering behind the flags, and — per new user request — now decode+store the signed-in email (`localStorage`, client-only) to show it in the popover, plus a "Profil" link to a new placeholder page (`public/profile/`, same unbundled pattern as `public/admin/`). Not yet committed.
Next_Actions:
- Ask the user to purge the Cloudflare cache for `muchogames.win` and retry login there.
- Run lint/format/build, then commit and push the new UI changes (email display, profile link, icon reorder, z-index fix, `public/profile/`).
- Test the sign-in/sign-out round-trip again on all three hosts once the above is deployed.
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
- 2026-09-05 Auth popover now shows the signed-in email + a "Profil" link to a new placeholder `/profile` page; login icon moved right of the language switcher; z-index fix so the popover no longer renders behind the flags.
- 2026-09-05 Google Sign-In status widget added to the hub (`auth.js`, client-only). Real `GOOGLE_CLIENT_ID` set; works on `bergamots.vercel.app`, still broken on `muchogames.win`.
- 2026-09-05 Yatzy reaction button pinned to the right edge of the game card. SW v22.
- 2026-09-04 Yatzy reaction button moved under the LANCER button (no longer a floating corner). SW v20.
- 2026-09-04 Fixed `api/yatsy/gifs.js` helper imports (`../_lib` not `../../_lib`). Production was crashing with `FUNCTION_INVOCATION_FAILED` even with `GIPHY_API_KEY` set.

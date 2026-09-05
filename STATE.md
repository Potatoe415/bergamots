# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis. `GIPHY_API_KEY` is set on Bergamots Production + Preview. Hub now has an optional Google Sign-In status icon (top-right, client-only, no data stored beyond a boolean), with a real `GOOGLE_CLIENT_ID` (Google Cloud project "muchogames") set in `auth.js`. Confirmed the site is also served at the custom domain `muchogames.win` (Cloudflare -> Vercel), now documented in `docs/TECH.md`.
Current_Goal: Test a real Google sign-in/sign-out round-trip on `npm run dev` (localhost:5173) and after the next production deploy.
Last_Action: Implemented the Google Sign-In status widget on the hub (`auth.js`, `#auth-widget`, `hub.css`), updated `docs/PRODUCT.md`/`docs/TECH.md`/`docs/DECISIONS.md`, verified lint/format/build. User provided the real OAuth Client ID (from a downloaded `client_secret_*.json`, whose `client_secret` is unused and was not committed) — pasted into `auth.js`.
Next_Actions:
- Test an actual Google sign-in/sign-out round-trip locally (`localhost:5173`), on `bergamots.vercel.app`, and on the custom domain `muchogames.win`.
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
- 2026-09-05 Google Sign-In status widget added to the hub (`auth.js`, client-only, no personal data stored). Needs a real `GOOGLE_CLIENT_ID`.
- 2026-09-05 Yatzy reaction button pinned to the right edge of the game card. SW v22.
- 2026-09-04 Yatzy reaction button moved under the LANCER button (no longer a floating corner). SW v20.
- 2026-09-04 Fixed `api/yatsy/gifs.js` helper imports (`../_lib` not `../../_lib`). Production was crashing with `FUNCTION_INVOCATION_FAILED` even with `GIPHY_API_KEY` set.
- 2026-09-04 Yatzy GIF tab in the reaction picker (Giphy, server-only key, Vite dev middleware so solo local works). SW v19. See DECISIONS.

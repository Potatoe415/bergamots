# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo. Yatzy reactions now include Giphy GIFs next to emojis.
Current_Goal: Confirm Yatzy GIF picker locally (solo) then add `GIPHY_API_KEY` on Vercel so production works.
Last_Action: Ported Coinchapp's Giphy GIF reactions to Yatzy: GIF tab in the picker, `api/yatsy/gifs.js` + Vite `/api/yatsy/gifs` middleware, CDN URL broadcast on the existing emoji channel, 5s overlay, SW cache v19. See `docs/DECISIONS.md` 2026-09-04.
Next_Actions:
- Manually confirm the Yatzy GIF tab in a local solo game: trending loads, search returns results, sending a GIF shows it then fades; emojis still work.
- Add `GIPHY_API_KEY` on Vercel (Production + Preview) and confirm GIFs on `bergamots.vercel.app`.
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
- 2026-09-04 Yatzy GIF tab in the reaction picker (Giphy, server-only key, Vite dev middleware so solo local works). SW v19. See DECISIONS.
- 2026-09-04 Yatzy emoji button repositioned to a bottom-right floating trigger; picker opens upward; TTL 1.8s->2.6s; SW cache v18. Verified broadcast delivery end-to-end against production with two independent clients.
- 2026-09-03 Secret fourth-roll checkbox also gives Player 1 a Yatzy on 50% of rolls.
- 2026-09-03 Yatzy: emoji-reaction button + picker, broadcast over the existing matchmaking channel (ported from Coinchapp).
- 2026-09-03 LANCER stays clickable after 3 rolls when “4e lancer secret” is on.

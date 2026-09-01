# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo.
Current_Goal: User to confirm the live GameBoy Web tile photo after this push.
Last_Action: Replaced the GameBoy Web SVG placeholder with `public/games/gameboy-web/assets/thumbnail.jpg` and pushed it.
Next_Actions:
- Confirm the live hub tile shows the original Game Boy photo.
- Rotate `ADMIN_PASSWORD` and copy `SUPABASE_URL` to Preview.
- Verify Yatzy online with two real devices.
- Decide what to do about the GitHub branch-protection rule.

Open_Questions:
- `GET /api/yatsy/games/[code]` is still unauthenticated.
- Room codes stay at 3 letters by user decision.
- A player who loses their `localStorage` can no longer re-enter a game in progress.
- Retention: `muchogames_events` is append-only with no purge job.
- Rename: only `muchogames_events` uses the new name.
- Whether to raise `printWidth` from 80 to 100.

Known_Issues (pre-existing, flagged by the audit, tracked in `docs/BACKLOG.md`):
- `public/games/**` is excluded from `format:check` on purpose.
- ~16.9 MB of unreferenced dead weight is still shipped to production.
- `public/assets/banner-games-hub-mobile.jpg` is byte-identical to the desktop banner.
- `shared/js/engine.js` and `public/shared/js/engine.js` are duplicated.
- `npm run build` only bundles `index.html` + `wordplayer.html`.
- No automated tests.

Recent_Changes:
- 2026-09-01 GameBoy Web hub tile uses the original Game Boy photo (`thumbnail.jpg`).
- 2026-09-01 Hub GameBoy Web tile launches the Vercel app; in-repo player/ROM copies deleted.
- 2026-09-01 GameBoy Web launches in-repo with porklike.gb (later removed once Vercel hosted it).
- 2026-09-01 Added GameBoy Web to the hub as an external tile.
- 2026-08-31 Unified the splash header across all 8 in-repo games.

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web hub tile launches the user's Vercel app. Tile art is the original Game Boy photo.
Current_Goal: Secret fourth roll stays clickable after roll 3 when the settings checkbox is on.
Last_Action: Stopped using HTML disabled on LANCER for the easter egg; 3 extra taps now perform the extra roll.
Next_Actions:
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
- 2026-09-03 LANCER stays clickable after 3 rolls when “4e lancer secret” is on.
- 2026-09-03 Yatzy secret fourth roll is off until the settings checkbox is enabled.
- 2026-09-02 Online Yatzy: three extra LANCER taps after roll 3 grant one more roll this turn.
- 2026-09-01 GameBoy Web hub tile uses the original Game Boy photo (`thumbnail.jpg`).
- 2026-09-01 Hub GameBoy Web tile launches the Vercel app; in-repo player/ROM copies deleted.

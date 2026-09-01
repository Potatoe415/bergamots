# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. GameBoy Web is an in-repo custom game. One homebrew test ROM (`porklike.gb`) ships with the hub. Nintendo ROMs are not in git.
Current_Goal: User to confirm the live GameBoy Web tile after this push: splash lists Porklike, and Open ROM still works for local files.
Last_Action: Pointed the hub tile at `/games/gameboy-web/index.html`, vendored the binjgb player, added a file picker, and shipped `porklike.gb` via `ROM/index.json`. Refused to commit Zelda/Tetris dumps from the sibling `ROM/` folder.
Next_Actions:
- After Vercel deploys, open GameBoy Web on the live hub and play Porklike.
- Rotate `ADMIN_PASSWORD` and copy `SUPABASE_URL` to Preview.
- Verify Yatzy online with two real devices.
- Decide what to do about the GitHub branch-protection rule.

Open_Questions:
- Whether later GameBoy Web UI work should happen in the sibling repo and be re-copied, or this vendored copy becomes the hub source.
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
- 2026-09-01 GameBoy Web launches in-repo; splash ships porklike.gb for testing; Nintendo ROMs stay off GitHub.
- 2026-09-01 Added GameBoy Web to the hub as an external tile (later replaced by the in-repo player).
- 2026-08-31 Unified the splash header across all 8 in-repo games.
- 2026-08-31 Translated `/admin` to English and added a per-game filter to the daily trend chart.
- 2026-08-30 Swept all seven project docs against the code.

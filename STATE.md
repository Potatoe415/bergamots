# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project on Vercel + Supabase. A full technical audit was run on 2026-08-30 (score 4.75/10, verdict "production-ready under conditions"). Priorities 1 to 4 of its 5-point plan are done and priority 5 is half done. Deployed and verified live on `bergamots.vercel.app` (also `www.patate.win`). Two follow-ups still need the user: rotate the demo `ADMIN_PASSWORD`, copy `SUPABASE_URL` to Preview.
Current_Goal: User to confirm the GameBoy Web hub tile (Autres tab) and, when they have a live player URL, replace the GitHub launch link.
Last_Action: Added GameBoy Web to `public/hub-config.json` as `kind: "external"` (id `gameboy-web`, category `autres`, launch `https://github.com/Potatoe415/gameboy-web`). Thumbnail at `public/games/gameboy-web/assets/thumbnail.svg`. Not copied into this repo: it stays a sibling project. No Vercel project and no GitHub Pages for it.
Next_Actions:
- Swap the GameBoy Web `launch` URL once a host exists (Vercel, GitHub Pages, or similar). Until then the tile opens the GitHub repo, not a playable emulator.
- User to manually check the unified splash header on the 8 migrated in-repo games at `http://localhost:5174/` if the browser MCP is still down.
- Deploy and check `/admin` live: English text throughout, the trend chart still renders for "All Games" by default, and picking a specific game updates the chart.
- Delete the verification row: `delete from public.muchogames_events where game_id = '__verification__';`
- Rotate `ADMIN_PASSWORD` via `vercel env add ADMIN_PASSWORD production --sensitive --force`, then redeploy.
- Copy `SUPABASE_URL` to the Preview environment.
- Verify Yatzy online end to end with two real devices.
- Confirm the winner banner still looks right after the `innerHTML` to `textContent` change.
- Decide what to do about the GitHub branch-protection rule.
- Watch the first CI run on GitHub.
- Decide whether to keep the 22 auth/throttle/observability assertions as the project's first test file.
- User to delete/decommission the Firebase project whenever ready.
- Confirm with user whether to keep or delete `refactor.py`.

Open_Questions:
- GameBoy Web has no public player URL. Hub currently points at GitHub. Confirm that, or provide a deploy URL.
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
- 2026-09-01 Added GameBoy Web to the hub as an external tile (GitHub launch, SVG thumbnail, Autres).
- 2026-08-31 Unified the splash header (back arrow, gear "Options" panel, empty-by-default center title) across all 8 in-repo games via new `public/shared/css/game-header.css` + `public/shared/js/game-header.js`.
- 2026-08-31 Translated `/admin` to English and added a per-game filter to the daily trend chart.
- 2026-08-30 Swept all seven project docs against the code (`2b75566`, `93fec6e`).
- 2026-08-30 Added a 7d/30d/6m range switch and a hand-rolled SVG daily trend chart to `/admin`.

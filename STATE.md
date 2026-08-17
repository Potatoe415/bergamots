# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Active project. Yatzy multiplayer fully migrated from Firebase to Vercel + Supabase (shared `multigames-db` project with `coinchapp`) and verified end-to-end in production. All info files (`docs/*`, `STATE.md`) audited and aligned with this reality; no remaining Firebase references outside historical decision/migration-note entries.
Current_Goal: Keep evolving the Bergamots game hub now that hosting is on Vercel and Yatzy is on Supabase.
Last_Action: Made the hub's language switcher (`bergamots-lang` in `localStorage`, `hub.js`) the starting language of every launched game, overriding whatever that game remembered on its own. `hub.js` now always persists the active language on load (not just on click) and appends `?lang=<code>` to external `kind: "external"` launch URLs. Every internal game/engine now seeds its initial language from `bergamots-lang` instead of a hardcoded `'fr'`: `wordplayer.js` (Pictionary/Taboo/Esquisse/Pigeon Pigeon), `public/games/blackstories/blackstories.js` (hub now outranks its own `blackstories_lang` memory), `public/games/pyramide/app.js`, `public/games/millionaire/app.js`, `public/games/cafards/game.js`, `public/games/yatsy/app.js` (only en/fr supported, `es` falls back to `fr`). Olé Mains had no language mechanism at all (always showed the `.fr` field even though `words.json` already has `en`/`es`): added `GameState.language` + `word[language] || word.fr` in `public/games/olemains/gameState.js`, and `main.js` now sets `document.documentElement.lang`/`gameState.language` from the hub value on init (rules loader already read that same attribute). Also updated the sibling `coinchapp` project (`lib/client/i18n.tsx`) to read `?lang=` before its own `coinchapp-locale` storage, so the Coinche/Bouilla hub tiles launch in the right language too (fr/en only; `es` falls back to its existing storage/default). `tranquil`/`easyfrog` are untouched (fully external, no source access); `diceduel` has no translatable text so nothing to change there. Verified with `node --check` on every modified `.js` game file, `npm run build` in both `bergamots` and `coinchapp`, and `npm run lint` in `coinchapp` (no new warnings). Confirmed the widespread `prettier --check` failures (113 files) are pre-existing via `git stash`, unrelated to this change.
Next_Actions:
- User to manually confirm, for each game family (wordpack, Black Stories, Olé Mains, Pyramide, Millionaire, Cafards, Yatzy, Coinche/Bouilla), that switching the hub's language flag then launching the game actually starts it in that language.
- User to manually check both new hub tiles (Coinche Mobile + Bouilla) still land on the right screen in `coinchapp`.
- User to manually test the 1v1 online flow (host + joiner tabs) to confirm both the sync-race fixes and the new remote-turn animations look right; report back if anything still looks off.
- User to delete/decommission the Firebase project (Hosting + Realtime Database) whenever ready — confirmed safe, no other game depends on it.
- Be aware Sync-Push/Pull use mtime-based conflict resolution, not real git merge — double-check important changes weren't silently overwritten after each sync.
- `GitHistory.txt` PULL entries only reach other machines once that computer next runs a Push — inherent limitation of the file-based sync approach (no server), flagged to user.
- Pick the first real item for `docs/BACKLOG.md` Now.
- Confirm with user whether to keep or delete `refactor.py` (one-off, already-applied migration script left at repo root).
- Decide on automated testing / error-handling conventions (see `docs/TECH.md` Open_Questions).
- Pre-existing, unrelated bug noticed: `eslint.config.mjs`'s browser-globals block (`files: ["apps/**/*.js", "shared/**/*.js"]`) doesn't match any real folder (games live under `public/games/**`, shared code under `public/shared/**`), so `npm run lint` reports hundreds of false-positive `no-undef` errors across the whole repo. Left untouched (out of scope for this migration); flagged for a future fix.

Open_Questions:
- Project_Name: Bergamots (confirmed from README/package.json)
- Target_Users: Confirmed in `docs/PRODUCT.md` (party-game groups, remote Yatzy players)
- Stack: Vanilla JS + Vite; Yatzy backed by Supabase Postgres via `api/yatsy/games/*` (see `docs/DATA_MODEL.md`, `docs/TECH.md`, both updated and confirmed).
- Deployment_Target: Vercel (confirmed live, `bergamots` project, Git-integration auto-deploy on push to `main`).

Recent_Changes:
- 2026-08-17 Hub-chosen language (`bergamots-lang`) now seeds the starting language of every launched game (internal + `coinchapp`), overriding each game's own memory (see Last_Action).
- 2026-08-17 Split the `coinchapp` hub tile into separate "Coinche Mobile" / "Bouilla" tiles, each launching straight into its own game.
- 2026-08-17 Added remote-turn dice-roll/score animations for Yatzy online 1v1, mirroring robot-turn visuals.
- 2026-08-17 Fixed Yatzy die-deselect/self-reroll glitches: removed `isLocalPlayersTurn()` from the pending-write guard in `app.js` (bypassed right after scoring, since currentPlayerIndex flips locally before the write is sent) and added `version`-based staleness filtering in `matchmaking.js`/`api/yatsy/games/[code].js`/`resume.js` so out-of-order refetch responses can no longer roll the UI back.
- 2026-08-16 Hub banner is now responsive: `<picture>`/`<source>` in `index.html` swaps to a dedicated mobile crop (`banner-games-hub-mobile.jpg`) under 600px, desktop keeps `banner-games-hub.jpg`.

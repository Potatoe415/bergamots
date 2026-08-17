# DECISIONS

Status: Append-only. Never edit past entries.

---

## Decision threshold

Log a decision if any of the following is true:
- Locks in a technology, library, or vendor.
- Changes the data model, persistence structure, ownership rules, or access model.
- Changes ownership or structure of a file or module.
- Cannot be reversed in under 30 minutes.
- Contradicts a previous entry in this file.

If unsure: add an Open_Question to `STATE.md`, not a decision entry.

---

## Template

## YYYY-MM-DD — Title

Decision: One sentence.
Context: Why this came up.
Rationale: Why this option over others.
Consequences: What this locks in or rules out.
Alternatives_Rejected: What was considered and why it lost.

---

## 2026-08-15 — Adopt agent-agnostic context architecture, retire sync-flow tooling

Decision: Adopted the `AGENTS.md`-centric context architecture (canonical protocol + thin routers `CLAUDE.md`/`GEMINI.md`/`.cursor/rules/000-router.mdc` + `STATE.md` + `docs/*`) for this existing project, and removed the manual multi-machine sync tooling (`Sync-Push.ps1`, `Sync-Pull.ps1`, their `.bat` launchers, and `SYNC-HISTORY.md`).
Context: The repo previously relied on ad-hoc reverse-engineering notes (`spectre_fonctionnel.md`, `spectre_technique.md`), a standalone Cursor rules file (`docs/ai/cursor.md`), and hand-rolled PowerShell scripts that pushed/pulled the repo across machines and logged a "files sent/received" counter to `SYNC-HISTORY.md`. Git plus a normal remote already provides sync; the counter file added noise without value.
Rationale: A single canonical protocol file with conditional loading (per `AGENTS.md` Startup Protocol) prevents drift across AI tools and keeps token usage low. Real product/tech knowledge from the old spec files was migrated into `docs/PRODUCT.md` and `docs/TECH.md` instead of being left as `TBD`, since this is an existing, non-empty project.
Consequences: `docs/PRODUCT.md` and `docs/TECH.md` are now frozen until the user authorises changes. Anyone syncing machines must use plain `git pull` / `git push` going forward; there is no more automated "last write wins by file timestamp" merge or sync log.
Alternatives_Rejected: Keeping the sync scripts alongside the new docs — rejected because the user explicitly asked to erase the old flow-measuring files, and duplicate sync mechanisms (git + custom scripts) invite drift. Keeping `spectre_*.md` as-is alongside `docs/PRODUCT.md`/`docs/TECH.md` — rejected to avoid two sources of truth.

---

## 2026-08-15 — Migrate Yatzy multiplayer + hub hosting from Firebase to Vercel + Supabase

Decision: Moved the whole hub from Firebase Hosting to Vercel (static build + new `api/yatsy/games/*` serverless functions in the same project), and replaced Yatzy's Firebase Realtime Database matchmaking with Supabase Postgres (`supabase/migrations/0001_yatzy.sql`), reusing the `coinchapp` project's security pattern (service-role key confined to server code, RLS blocking all direct client access to game rows).
Context: User asked to reuse the same Vercel+Supabase system as `dev-projects/coinchapp` for Yatzy's online multiplayer instead of Firebase.
Rationale: `coinchapp`'s security boundary ("browser never touches Postgres for game rows") requires a server-side authority; Bergamots had no backend, so Vercel Serverless Functions under `api/` take on that role while the existing vanilla-JS Yatzy frontend and its room-code + seat-token capability model are kept unchanged (no React/Next.js rewrite, no new auth system — YAGNI). Since the whole hub previously deployed as one static site, moving hosting entirely to Vercel avoids splitting the hub across two hosting providers.
Consequences: `firebase.json`/`.firebaserc` removed; Firebase Hosting and the Firebase Realtime Database are no longer used by this repo (the Firebase project itself is not deleted — that is a separate manual decision, flagged to the user). New required env vars on Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. A new Supabase project must be created and the migration run before Yatzy online multiplayer works again.
Alternatives_Rejected: Rewriting Yatzy in Next.js/React to mirror `coinchapp`'s Server Actions exactly — rejected to avoid introducing a UI framework for one game in an otherwise framework-free hub. Adopting Supabase anonymous auth (`user_id`-based seats) like `coinchapp` — rejected, since the existing room-code + resume-token capability model already solves Yatzy's 2-seat, no-accounts use case without an auth system. Splitting hosting (hub on Firebase Hosting, Yatzy API on a separate Vercel project) — rejected in favor of one hosting provider for the whole hub.

---

## 2026-08-16 — Reuse coinchapp's Supabase project (renamed `multigames-db`) instead of a dedicated one

Decision: Yatzy uses the same Supabase project as `coinchapp` (renamed `multigames-db` by the user), not a new dedicated Supabase project. Yatzy's tables are namespaced (`yatzy_games`, `yatzy_game_events`) to avoid colliding with coinchapp's `games`/`game_players`/`game_events`.
Context: User explicitly asked to reuse the same DB as `coinchapp` rather than provisioning a separate Supabase project, and provided the project URL + public (`sb_publishable_...`) key.
Rationale: One shared Supabase project across the user's apps is simpler to manage (one dashboard, one bill) than one project per app; RLS + table namespacing fully isolate Yatzy's data from coinchapp's, so sharing the project has no security cost.
Consequences: `public/games/yatsy/supabase-config.js` and the Vercel `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env vars point at `multigames-db`. Any future schema change must keep checking for name collisions with coinchapp's tables/cron jobs/realtime publications in that same project. Verified end-to-end in production (create/join/delete against `https://bergamots.vercel.app/api/yatsy/games`).
Alternatives_Rejected: Provisioning a fresh, dedicated Supabase project for Yatzy — rejected per explicit user instruction to reuse the existing one.

---

## 2026-08-16 — Confirm Firebase project can be fully decommissioned

Decision: Confirmed to the user that their Firebase project (Hosting + Realtime Database) can be deleted entirely; no game in this repo depends on it anymore.
Context: User asked for an explicit go/no-go before deleting Firebase, after the Yatzy migration to Supabase.
Rationale: Repo-wide search (SDK imports, `initializeApp`, `firebaseConfig`, `firebasejs` CDN URLs) found zero remaining references outside historical docs/comments; Firebase was only ever used by Yatzy per the original `docs/PRODUCT.md` constraint, and that constraint's implementation is now Supabase.
Consequences: `docs/PRODUCT.md`/`docs/BACKLOG.md` updated to drop the last Firebase mentions; a stale comment in `public/games/olemains/gameState.js` was fixed. Deleting the Firebase project is the user's own action, not performed by an agent.
Alternatives_Rejected: None — this was a verification, not a design choice.

---

## 2026-08-16 — Reintroduce Sync-Push/Pull tooling (reverses the 2026-08-15 retirement)

Decision: User chose to bring back `Sync-Push.bat`/`Sync-Pull.bat` (and their `.ps1` scripts) for multi-machine sync, reversing the 2026-08-15 decision that retired this tooling in favor of plain `git pull`/`git push`.
Context: The four files reappeared untracked in the working tree (not restored from git history). Flagged to the user that this contradicts the prior decision and its known risks — blind `git add -A`/commit with no diff review, "last write wins by file mtime" conflict resolution (fragile after clone/checkout, since mtimes reset), and direct unreviewed pushes to `main`. User was asked to choose between plain git, reintroducing the scripts as-is, or deleting them, and picked reintroduction with the risks understood.
Rationale: User's explicit choice, made with the risks stated up front.
Consequences: `Sync-Push.bat`/`Sync-Pull.bat`/`Sync-Push.ps1`/`Sync-Pull.ps1` are tracked again. The date-based "last write wins" merge behavior is back in use for this repo; anyone using it should be aware a file can be silently overwritten in either direction if local/remote timestamps don't reflect true recency (e.g. right after a fresh clone or checkout).
Alternatives_Rejected: Plain `git pull`/`git push` (the 2026-08-15 replacement) — user preferred the one-click scripts despite the risks. Deleting the reappeared files — rejected by user.

---

## 2026-08-16 — Add `category` field to `HubGameEntry`, redesign the hub with tabs + language switcher

Decision: Applied the visual redesign staged in `temp-design/` (a design-tool mockup, `Bergamots Accueil.dc.html`) to the real hub: rewrote `index.html`/`hub.css`/`hub.js`, added a `category` (`cartes`/`mots`/`autres`) field to every entry in `public/hub-config.json`, added a FR/EN/ES flag language switcher (persisted in `localStorage`), and replaced `public/assets/banner-games-hub.jpg` with the new banner image supplied in `temp-design/assets/banner-bergamots-2.jpg`.
Context: User asked to "apply the design from temp-design". The mockup fully specified markup, colors, category tabs, and a new banner, so no clarifying questions were needed; mapped each of the 14 existing games to a category by reading the mockup's own `GAMES` grouping.
Rationale: The mockup is a complete, unambiguous spec (inline styles + logic) authored against this exact repo's assets (`public/games/*/assets/thumbnail.*`), so reproducing it as real CSS classes + a small state-driven `hub.js` was the most direct path; adding `category` to the config (rather than hardcoding the grouping in JS) keeps the "config over code" principle from `docs/TECH.md`.
Consequences: `docs/DATA_MODEL.md` updated (`HubGameEntry.category`, new constraint: every entry needs a valid category or it silently won't render under any tab). Game titles/thumbnails are unchanged; only tab labels translate per language, matching the mockup (game names themselves aren't translated). The `temp-design/` folder itself (design-tool working directory, untracked) was left in place, not deleted — flagged to the user since it isn't `.gitignore`d.
Alternatives_Rejected: Hardcoding the category grouping inside `hub.js` instead of the config — rejected, would violate the existing "adding a game requires zero hub.js changes" convention.

---

## 2026-08-17 — Standardize on "splash screen: back top-left, settings top-right" across every game

Decision: Every game (internal + the sibling `coinchapp` repo's Coinche/Bouilla tiles) must show a splash/start screen with a back-to-hub control top-left and a settings control top-right. Audited all games against Yatzy's existing implementation (`public/games/yatsy/index.html`: `.splash-back-button` / `#settings-button` + `.settings-panel`) as the reference pattern; most already complied via an equivalent header-row layout (back-left / controls-right), so only the real gaps were touched: Black Stories (had no splash screen and no settings button, just always-visible language chips) and Dice Duel (had a home screen but zero back/settings navigation). In `coinchapp`, settings was already covered by its existing global top-right `LanguageSwitcher`; only the back-to-hub link was missing (`app/page.tsx`) or pointing at the wrong destination (`app/bouilla/page.tsx` linked to coinchapp's own home instead of the Bergamots hub).
Context: User asked for every game to have a splash screen with a back button top-left and a settings button top-right. Scoped with the user: internal games + `coinchapp` are in scope; Easy Frog/Tranquil stay out of scope (fully external, no source access). For games with no existing settings concept, the settings button should open a real functioning panel (not a fake placeholder), reusing whatever content the game already has (language switcher for Black Stories, rules for Dice Duel) rather than inventing new configurable options.
Rationale: Reusing Yatzy's existing markup/class conventions (`.settings-button`, `.settings-panel`, `.is-visible`) keeps the pattern recognizable across games without introducing a new shared component/framework, in line with "each custom game is isolated in its own folder, no forced code sharing beyond `shared/`" (`docs/TECH.md`). Repurposing existing content (language chips, rules text) for the settings panel avoids YAGNI violations (no fake settings) while still satisfying the "real panel" requirement.
Consequences: Black Stories now requires an explicit "Commencer" tap before the first riddle shows (previously it rendered immediately) — this is a UX change, not just an added button. Dice Duel's rules text moved from a permanently visible block into a settings panel gated by the new gear button. `coinchapp`'s `app/page.tsx` and `app/bouilla/page.tsx` back buttons now hard-link to `https://bergamots.vercel.app/` (absolute URL, since coinchapp is a different Vercel deployment/origin) instead of `/` — anyone testing coinchapp standalone (not via the hub) will be redirected off-site by that button. A new `backToHub` i18n key was added to `coinchapp` alongside the existing `backToDashboard`/`backHome` (which mean "back to coinchapp's own home", a different destination).
Alternatives_Rejected: Restructuring the shared Wordplayer engine or the already-compliant games (Olé Mains, Cafards, Millionaire, Pyramide) into a distinct full-screen splash — rejected per user's explicit answer that their existing persistent header (back-left / controls-right) already satisfies the requirement. Inventing placeholder settings (e.g. a sound toggle Dice Duel doesn't have) just to fill an empty panel — rejected as fake production logic with no real function.

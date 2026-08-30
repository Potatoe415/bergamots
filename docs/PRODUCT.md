# PRODUCT

Status: Living document. Never edit autonomously — confirm with user first.

---

Project_Name: Bergamots
Objective: Provide a single hub to browse and launch a curated collection of party/group games from one page, with zero setup per game (no accounts, no install).
Problem: Party/group games are scattered across apps and links; Bergamots centralizes them behind one dashboard with a consistent look and multilingual support.

Target_Users:
- Groups of friends/family playing together in person (word-guessing games, riddles, dice games, quizzes).
- Remote pairs/groups playing Yatzy online together via a shared room code.

Core_Features:
- Hub/dashboard (`index.html` + `hub.js`) rendering game tiles from `public/hub-config.json`. Three launch kinds: `wordpack` (shared engine), `custom` (standalone app), `external` (external link).
- Wordplayer engine (`wordplayer.html` + `wordplayer.js` + `shared/js/engine.js`): shared word-guessing game shell used by Pictionary, Taboo, Esquisse, Pigeon Pigeon. Config: timer choice → play (show/hide word, validate/pass) → end stats.
- Olé Mains: word-guessing game with deck selection, countdown, successive word reveal, final scoring (1 point validated / 0 passed).
- Black Stories: dark riddles. Read title/short riddle → think → reveal full solution. History navigation (previous/random next), multilingual, per-story illustrations.
- Yatzy (`public/games/yatsy/`): dice poker. Roll (max 3) → keep dice → pick a scoring category. Automatic scoring (Full, Square, Straights), +35 upper-section bonus above 63, Yatzy handling (5 identical dice). Online multiplayer via 3-letter room codes backed by Supabase Postgres (via `api/yatsy/games/*` Vercel serverless functions).
- Other custom games with their own data/rules: Millionaire (quiz), Salade de Cafards, Pyramide, and others under `public/games/`.
- Multilingual support (FR/EN/ES) for rules and word/question content, driven by JSON fields rather than code.
- Admin stats page (`public/admin/`, reachable at `/admin`): password-protected page showing how often each game is launched from the hub, over a period the admin picks (7 days / 30 days / 6 months), with a total for that period, a daily trend chart and a ranking by game. Read-only; it cannot edit any content.

Out_Of_Scope:
- Centralized user accounts / authentication for players (anonymous by default). The admin stats page is the one exception: it is gated by a single shared password, with no account, session, or user record.
- Persistent scores/progress across sessions (scores are per game session; Yatzy game state persists only for the lifetime of a room, up to 48h TTL for purge).
- Visitor-level analytics: launch counts are aggregate only, with no IP, user agent, device, country, or session identifier stored. Reaffirmed on 2026-08-30, when unique visitors, live presence, devices and countries were considered for the stats page and deliberately declined rather than overlooked.

User_Roles:
- Player: no distinct roles or permissions; anonymous by default.
- Admin: whoever knows `ADMIN_PASSWORD`. Grants read-only access to the launch stats and nothing else.
- Yatzy room creator/joiner: implicit roles (`creator` / `joiner`) tied to a room code and a resume token, not to an account.

Success_Criteria:
- All games load and are playable via `npm run dev` and `npm run build`.
- Adding a new wordpack game requires zero code changes: a data JSON under `public/data/<id>/` plus one entry in `public/hub-config.json`.

Constraints:
- Vanilla HTML/CSS/JavaScript only; no heavy UI framework (see `docs/TECH.md`).
- Supabase (via Vercel serverless functions) is used only for Yatzy multiplayer state and hub launch counters, not for any other feature. Game content stays in static JSON.
- Everything must stay on free tiers (Vercel Hobby, Supabase free). No paid feature may be introduced without explicit approval.

Open_Questions:
- None currently tracked. Add here before making product-scope decisions autonomously.

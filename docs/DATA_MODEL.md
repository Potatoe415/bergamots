# DATA MODEL

Status: Living document. Update whenever persisted data structure changes.

---

## Source of Truth

Technical_Source: Static JSON files in the repo (`public/hub-config.json`, `public/data/<gameId>/*.json`) + Supabase Postgres for Yatzy room state (`supabase/migrations/0001_yatzy.sql`, tables `yatzy_games`/`yatzy_game_events`).

Rule:
- If technical schema files exist, they are the executable source of truth.
- This document is the human/agent-readable map. It must not contradict them.
- Update this document whenever persisted data structure changes.

---

## Storage Overview

Database_Type: File-based static content (JSON) + a Supabase (Postgres) project for ephemeral multiplayer state (`yatzy_games`, `yatzy_game_events`).
Persistence_Model: Game catalog and word/question content are read-only static files shipped with the build. Yatzy room state is the only mutable, network-persisted data, and is ephemeral (TTL-purged: soft 3h expiry on unstarted/stale rooms checked by the API, hard 48h `pg_cron` delete).

---

## Entities

### Entity: HubGameEntry

Purpose: Describes one game tile in the hub and how to launch it.
Storage: `public/hub-config.json` (JSON array, one object per game).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | kebab-case, matches `public/games/<id>/` folder |
| title | string | Yes | Display name on the hub tile |
| kind | string | Yes | `wordpack` \| `custom` \| `external` |
| category | string | Yes | `cartes` \| `mots` \| `autres` — which hub tab the tile appears under |
| engine | string | wordpack only | e.g. `wordplayer` |
| launch | string | Yes | Relative path or external URL to open |
| data | string | wordpack only | Path to the game's word JSON |
| thumbnail | string | Yes | Path to `assets/thumbnail.jpg` for the tile |

Relationships:
- `data` points to a `WordPack` entity (wordpack games only).
- `id` maps 1:1 to a folder under `public/games/<id>/`.

Constraints:
- `id` must be unique across the array.
- `thumbnail` file must exist at build time for the tile to render correctly.
- `category` must be one of `cartes` / `mots` / `autres`; `hub.js` renders only the games matching the currently selected tab (no fallback bucket), so every entry needs a valid value.

Access_Rules:
- Public, read-only, fetched client-side by `hub.js` and `wordplayer.js`.

Sensitive_Data:
- None.

---

### Entity: WordPack

Purpose: Word/round dataset consumed by the shared wordplayer engine.
Storage: `public/data/<gameId>/<gameId>_words.json`.

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| gameId | string | Yes | Matches `HubGameEntry.id` |
| title | string | Yes | Display title |
| controls | string[] | Yes | e.g. `["next"]` or `["pass","validate"]` |
| words | Word[] | Yes | See below |

Word object fields: `id`, `text`, optional `fr` / `en` / `es` translations.

Relationships:
- Referenced by exactly one `HubGameEntry.data`.

Constraints:
- Read-only at runtime (no writes from the client).

Access_Rules:
- Public, read-only, fetched client-side.

Sensitive_Data:
- None.

---

### Entity: YatzyGameRecord

Purpose: Ephemeral multiplayer room state for Yatzy, keyed by a 3-letter room code.
Storage: Supabase Postgres, table `yatzy_games` (see `supabase/migrations/0001_yatzy.sql` and `api/yatsy/games/`), plus `yatzy_game_events` (a tiny realtime "tick" table carrying only `game_code`/`version`, no game data).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| code | text (PK) | Yes | 3 uppercase letters, generated server-side, retried on collision |
| created_at | timestamptz | Yes | Used for TTL/expiry checks |
| status | text | Yes | `waiting` \| `playing` |
| game_state | jsonb \| null | Yes | Opaque Yatzy game state (dice, scores, turn) written by `PUT /api/yatsy/games/{code}/state` |
| creator_token | text \| null | Yes | Resume token for the creator seat |
| joiner_token | text \| null | Yes | Resume token for the joiner seat |
| version | bigint | Yes | Optimistic-concurrency / realtime-tick counter, bumped on every write |

Relationships:
- Standalone; not linked to any other entity or user account.
- `yatzy_game_events.game_code` references `yatzy_games.code` (cascade delete).

Constraints:
- Room code: 3 uppercase letters (`A-Z`), generated inside `api/yatsy/games/index.js`, retried on collision.
- Considered expired after `GAME_TTL_MS` (3h) since `created_at`; checked and lazily deleted by the API on read/join/resume.
- Hard-purged after 48h by an hourly `pg_cron` job (see the migration file), independent of the app-level check.

Access_Rules:
- No authentication. The browser never reads/writes `yatzy_games` directly — Row Level Security has zero policies on it, so only the service-role key (used exclusively inside `api/yatsy/games/*` serverless functions) can access it. Client-facing access control is by knowledge of the room code plus the per-seat resume token, enforced by those functions (capability-based, not identity-based).
- `yatzy_game_events` allows public `select` (any client) since it carries no game data, only enough to trigger a client refetch via the API.

Sensitive_Data:
- None (no personal data stored; tokens are random session capabilities, not identifiers).

---

## Relationships

- `HubGameEntry` 1—1 `WordPack` (wordpack games only, via `data` path).
- `HubGameEntry` 1—1 game folder under `public/games/<id>/`.
- `YatzyGameRecord` is standalone, keyed by room code, independent of the hub config.

---

## Access Model

Roles: None (anonymous). Yatzy uses ad-hoc `creator` / `joiner` seat roles scoped to a single room code.
Rules: All static JSON is public and read-only. Yatzy room reads/writes go exclusively through `api/yatsy/games/*` (Vercel serverless functions using the Supabase service-role key); those functions validate the room code + per-seat resume token before returning or mutating state. Direct client access to `yatzy_games` is blocked outright by Row Level Security (no policies), regardless of what the client knows.

---

## Migration Notes

## 2026-08-15 — Bootstrap migration

Change: Created this data model document by reverse-engineering `public/hub-config.json`, `public/data/*/`, and `public/games/yatsy/matchmaking.js`. Superseded the old ad-hoc `spectre_technique.md`/`spectre_fonctionnel.md` notes, which are now removed.
Reason: Future agents need a stable, accurate map of persisted data instead of scattered reverse-engineering notes.
Impact: No schema or storage engine changed. Documentation only.

## 2026-08-15 — Yatzy: Firebase Realtime Database to Supabase Postgres

Change: `YatzyGameRecord` moved from a Firebase Realtime Database tree (`games/{code}`) to Supabase Postgres tables `yatzy_games` + `yatzy_game_events` (`supabase/migrations/0001_yatzy.sql`), accessed exclusively through new `api/yatsy/games/*` Vercel serverless functions instead of direct client SDK reads/writes.
Reason: Reuse the `coinchapp` project's Vercel+Supabase pattern (service-role key confined to server code, RLS blocking all direct client access) for Yatzy's online multiplayer, as part of the wider Firebase Hosting to Vercel hosting migration.
Impact: Access control is now enforced by Row Level Security + server-side token checks instead of relying on Firebase rules (not tracked in this repo). Field names changed from Firebase's nested `seats.creator.token`/`seats.joiner.token` to flat `creator_token`/`joiner_token` columns.

# DATA MODEL

Status: Living document. Update whenever persisted data structure changes.

---

## Source of Truth

Technical_Source: Static JSON files in the repo (`public/hub-config.json`, `public/data/<gameId>/*.json`) + Firebase Realtime Database for Yatzy room state (schemaless, defined by `public/games/yatsy/matchmaking.js`).

Rule:
- If technical schema files exist, they are the executable source of truth.
- This document is the human/agent-readable map. It must not contradict them.
- Update this document whenever persisted data structure changes.

---

## Storage Overview

Database_Type: No relational/document DB. File-based static content (JSON) + one Firebase Realtime Database tree for ephemeral multiplayer state.
Persistence_Model: Game catalog and word/question content are read-only static files shipped with the build. Yatzy room state is the only mutable, network-persisted data, and is ephemeral (TTL-purged).

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
Storage: Firebase Realtime Database, path `games/{code}` (see `public/games/yatsy/matchmaking.js`).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| createdAt | number (ms epoch) | Yes | Used for TTL/expiry checks |
| status | string | Yes | `waiting` \| `playing` |
| gameState | object \| null | Yes | Opaque Yatzy game state (dice, scores, turn) written by `updateGameState` |
| seats.creator.token | string \| null | Yes | Resume token for the creator seat |
| seats.joiner.token | string \| null | Yes | Resume token for the joiner seat |

Relationships:
- Standalone; not linked to any other entity or user account.

Constraints:
- Room code: 3 uppercase letters (`A-Z`), generated client-side, retried on collision.
- Considered expired after `GAME_TTL_MS` (3h) since `createdAt`; auto-removed on next read.
- Purged after `PURGE_AFTER_MS` (default 48h, configurable via `YATZY_CONFIG.matchmaking.purgeAfterHours`).

Access_Rules:
- No authentication. Access control is entirely by knowledge of the room code plus the per-seat resume token (capability-based, not identity-based).

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
Rules: All static JSON is public and read-only. Yatzy room writes are permitted to anyone holding the matching room code + resume token; no server-side authorization beyond Firebase Realtime Database rules (not tracked in this repo).

---

## Migration Notes

## 2026-08-15 — Bootstrap migration

Change: Created this data model document by reverse-engineering `public/hub-config.json`, `public/data/*/`, and `public/games/yatsy/matchmaking.js`. Superseded the old ad-hoc `spectre_technique.md`/`spectre_fonctionnel.md` notes, which are now removed.
Reason: Future agents need a stable, accurate map of persisted data instead of scattered reverse-engineering notes.
Impact: No schema or storage engine changed. Documentation only.

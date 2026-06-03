# DATA MODEL

Status: Living document. Update whenever persisted data structure changes.

---

## Source of Truth

Technical_Source: TBD
Examples: SQL migrations / ORM schema / Firestore rules / Supabase migrations / JSON file structure

Rule:
- If technical schema files exist, they are the executable source of truth.
- This document is the human/agent-readable map. It must not contradict them.
- Update this document whenever persisted data structure changes.

---

## Storage Overview

Database_Type: TBD
Persistence_Model: TBD

---

## Entities

None defined yet.

Use this template when adding an entity:

### Entity: <Name>

Purpose: TBD
Storage: TBD

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | TBD | Yes | Primary identifier |

Relationships:
- TBD

Constraints:
- TBD

Access_Rules:
- TBD

Sensitive_Data:
- TBD

---

## Relationships

None defined yet.

---

## Access Model

Roles: TBD
Rules: TBD

---

## Migration Notes

## 2026-06-03 — Bootstrap

Change: Created empty data model document.
Reason: Future agents need a stable map of persisted data.
Impact: No database selected. No schema defined.

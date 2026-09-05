# BACKLOG

Status: Living document. Always reflects current state.

---

## Now
- [ ] Fill in real Supabase env vars (`.env.local`, `client/.env.local`, Vercel dashboard) — see `docs/RUNBOOK.md`.
- [ ] Play-test online mode end-to-end on the new Supabase/Vercel backend (two browser windows: create/join room, play, reload mid-game, seat-takeover after 30s idle).
- [ ] Play-test "Play vs Bot" mode end-to-end (unaffected by the backend migration, but re-verify).
- [ ] Play-test local pass-and-play end-to-end (unaffected by the backend migration, but re-verify).

## Next
- [ ] Fill docs/PRODUCT.md with confirmed scope.
- [ ] Mobile layout polish (card sizes on small screens).
- [ ] Add score/stats summary on game over screen.
- [ ] Stormy Seas expansion (Section 6) — Jagged Rocks, Sea Monsters, Storm & Compass.
- [ ] Idle-turn timer / bot-takeover for online mode (coinchapp already has this pattern) — only if disconnections prove to be a real problem.

## Later
- [ ] Competitive variant (Section 7.5).
- [ ] Persistent high scores / session history.
- [ ] Card artwork assets (replace CSS gradients).

## Blocked
- (none)

## Done
- [x] Delay game-over overlay ~2s so the last placed tile / losing board stays visible (online + local/bot).
- [x] iOS Safari: hand tiles clipped under the browser toolbar until rotate-to-landscape (visual viewport height + hand `min-w-0`).
- [x] Share-game-link button on the online create-room connecting screen (native share / copy `?room=` URL).
- [x] Migrated online backend from Railway/Socket.IO to Vercel Serverless Functions + Supabase (shared project with coinchapp) — see docs/DECISIONS.md (2026-08-03).
- [x] Play vs Bot: co-op heuristic bot + lobby button + auto-play in local mode.
- [x] Bootstrap context architecture.
- [x] Phase 1: shared game engine with 32 unit tests (100% pass).
- [x] Phase 2: Node.js + Socket.IO server with reconnection support.
- [x] Phase 3: React + Vite + Tailwind client — Grid, Hand, DiscardModal, StartDiscardModal.
- [x] Phase 4: Pass-and-play transition screen + socket disconnect state preservation.

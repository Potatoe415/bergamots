# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend on Vercel + Supabase. Share-game-link button is on origin/main and in the current production bundle at tranquil-woad.vercel.app.
Current_Goal: Add a win flourish when the Finish card ends the game outright.
Last_Action: New `FinishCardFlourish.tsx`: light burst at screen center, then the
    10|Finish card flies to rest (glowing, pulsing) in the top-right corner, plus a
shimmer sound. Wired into `GameBoard.tsx` via a `playing`→`won` phase-transition
watcher (the only way that transition happens is a Finish card played on a
complete grid with no monsters left — see `gameEngine.ts`). Verified visually
via a temporary `?previewFinish=1` flag in `main.tsx` (reverted after). `npm
run build -w client` and `npm test` both pass.
Next_Actions:
- Play a full local game to a Finish-card win to sanity-check timing/position
  on a real board (only checked in isolation so far).
- Carried over, still pending verification after deploy: invite-link `?room=`
    20|  only + partner not inheriting host name/avatar; Bergamots-hub avatar next
  to own name; friend re-test of the mobile hand on a real iPhone.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

    30|Recent_Changes:
- 2026-09-08 Finish-card win flourish: light burst + card flies to top-right
  corner with a glow pulse + shimmer sound. See `FinishCardFlourish.tsx`,
  `GameBoard.tsx`, `sounds.ts`, `index.css`.
- 2026-09-06 Invite links no longer carry hub `?name=`/`?avatar=`. Partner does not inherit the host's identity. See ConnectingScreen / hubAvatar.
- 2026-09-06 Online GameBoard shows hub `?avatar=` thumb next to own name. Local/bot unchanged. See DECISIONS.
- 2026-09-06 `App.tsx`/`Lobby.tsx` pseudo fields pre-filled from `?name=` sent by the Bergamots hub. See DECISIONS.
- 2026-09-06 Bugfix: Real fix for the mobile hand bug — it's horizontal overflow (cards don't shrink to fit screen width; confirmed from screenshots showing hand-count badge > visible cards), not vertical toolbar clipping. `Hand.tsx` now sizes cards via `ResizeObserver` with a 44px floor + horizontal scroll fallback for large hands.

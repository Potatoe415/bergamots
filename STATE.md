# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend on Vercel + Supabase. Share-game-link button is on origin/main and in the current production bundle at tranquil-woad.vercel.app.
Current_Goal: Show the hub avatar next to the local player's name in online games.
Last_Action: Online `GameBoard` reads `?avatar=` (`hubAvatar.ts`, sessionStorage) and shows a small circle next to `{me.name} (you)`. Local/bot boards do not get the prop.
Next_Actions:
- Once deployed, launch from the Bergamots hub with a profile photo, create/join an online room, confirm the small avatar sits next to your name; local/bot must stay without it.
- Once deployed, manually confirm: launching from the Bergamots hub with a profile name pre-fills "your name" (bot/create/join) and Player 1 (local); opening this app directly still shows the old defaults.
- If the user still doesn't see the share button: hard-refresh / open https://tranquil-woad.vercel.app, create an online room, wait until the room code appears on the stepper.
- Have the user's friend re-test the mobile hand on a real iPhone after this deploy.
- Ask whether PRODUCT/TECH should mention the hub avatar (not edited autonomously).

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Recent_Changes:
- 2026-09-06 Online GameBoard shows hub `?avatar=` thumb next to own name. Local/bot unchanged. See DECISIONS.
- 2026-09-06 `App.tsx`/`Lobby.tsx` pseudo fields pre-filled from `?name=` sent by the Bergamots hub. See DECISIONS.
- 2026-09-06 Bugfix: Real fix for the mobile hand bug — it's horizontal overflow (cards don't shrink to fit screen width; confirmed from screenshots showing hand-count badge > visible cards), not vertical toolbar clipping. `Hand.tsx` now sizes cards via `ResizeObserver` with a 44px floor + horizontal scroll fallback for large hands.
- 2026-09-06 Bugfix: Undid the `position: fixed` mobile-viewport fix (it made iOS clipping worse — needed app background/foreground instead of rotate). `#game-board` is normal-flow again, sized via JS-measured `--app-height`.
- 2026-09-05 UX: 2s delay before GameOver overlay; highlight last grid change on game end.

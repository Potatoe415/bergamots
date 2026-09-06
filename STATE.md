# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend on Vercel + Supabase. Share-game-link button is on origin/main and in the current production bundle at tranquil-woad.vercel.app.
Current_Goal: Keep invite links free of the host's hub name and avatar.
Last_Action: Share URL is now `?room=` only. Hub `?name=`/`?avatar=` are ignored when a room code is present, so a partner cannot inherit the host's identity.
Next_Actions:
- After deploy: create an online room from a hub launch, share the link, confirm it has only `?room=` and that player 2's name field is not the host's.
- Once deployed, launch from the Bergamots hub with a profile photo, create/join an online room, confirm the small avatar sits next to your name; local/bot must stay without it.
- Have the user's friend re-test the mobile hand on a real iPhone after this deploy.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Recent_Changes:
- 2026-09-06 Invite links no longer carry hub `?name=`/`?avatar=`. Partner does not inherit the host's identity. See ConnectingScreen / hubAvatar.
- 2026-09-06 Online GameBoard shows hub `?avatar=` thumb next to own name. Local/bot unchanged. See DECISIONS.
- 2026-09-06 `App.tsx`/`Lobby.tsx` pseudo fields pre-filled from `?name=` sent by the Bergamots hub. See DECISIONS.
- 2026-09-06 Bugfix: Real fix for the mobile hand bug — it's horizontal overflow (cards don't shrink to fit screen width; confirmed from screenshots showing hand-count badge > visible cards), not vertical toolbar clipping. `Hand.tsx` now sizes cards via `ResizeObserver` with a 44px floor + horizontal scroll fallback for large hands.
- 2026-09-06 Bugfix: Undid the `position: fixed` mobile-viewport fix (it made iOS clipping worse — needed app background/foreground instead of rotate). `#game-board` is normal-flow again, sized via JS-measured `--app-height`.

# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend on Vercel + Supabase. Share-game-link button is on origin/main and in the current production bundle at tranquil-woad.vercel.app.
Current_Goal: Match the sibling Bergamots-hub apps' header convention (back button top-left, options button top-right) across tranquil's own screens.
Last_Action: Reworked `Lobby` and `GameBoard` headers to the back-top-left /
options-top-right convention used by the sibling Bergamots-hub games and
coinchapp. `Lobby` gained floating top-left "back to hub" (links to
`https://bergamots.vercel.app/`, new `.icon-btn-float` class in `index.css`)
and top-right "options" (opens the existing `SettingsPanel`) buttons; removed
the now-redundant bottom-bar Settings button. `GameBoard`'s header now puts
the existing back-to-menu button on the far left and the existing settings
gear on the far right (previously both were grouped on the left). Language
switching is consolidated into `SettingsPanel` (one place, like the sibling
apps' options panels) instead of a separate persistent `LanguageSwitcher` —
removed from `App.tsx`'s lobby overlay and from `GameBoard`'s header.
`npm run build -w client` and `npm test` pass; verified visually in-browser
(both corners, in Lobby and in-game).
Next_Actions:
- Play a full local game to a Finish-card win to sanity-check win-flourish
  timing/position on a real board (only checked in isolation so far).
- Carried over, still pending verification after deploy: invite-link `?room=`
  only + partner not inheriting host name/avatar; Bergamots-hub avatar next
  to own name; friend re-test of the mobile hand on a real iPhone.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Recent_Changes:
- 2026-09-09 Lobby/GameBoard headers now follow the back-top-left/options-top-right convention shared with the Bergamots-hub apps; language switch moved into SettingsPanel. See `Lobby.tsx`, `GameBoard.tsx`, `App.tsx`, `SettingsPanel.tsx`, `index.css`.
- 2026-09-08 Finish-card win flourish: light burst + card flies to top-right
  corner with a glow pulse + shimmer sound. See `FinishCardFlourish.tsx`,
  `GameBoard.tsx`, `sounds.ts`, `index.css`.
- 2026-09-06 Invite links no longer carry hub `?name=`/`?avatar=`. Partner does not inherit the host's identity. See ConnectingScreen / hubAvatar.
- 2026-09-06 Online GameBoard shows hub `?avatar=` thumb next to own name. Local/bot unchanged. See DECISIONS.
- 2026-09-06 Bugfix: Real fix for the mobile hand bug — it's horizontal overflow (cards don't shrink to fit screen width; confirmed from screenshots showing hand-count badge > visible cards), not vertical toolbar clipping. `Hand.tsx` now sizes cards via `ResizeObserver` with a 44px floor + horizontal scroll fallback for large hands.

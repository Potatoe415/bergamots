# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend on Vercel + Supabase. Share-game-link button is on origin/main and in the current production bundle at tranquil-woad.vercel.app.
Current_Goal: No PRODUCT.md confirmation blocker here (this app's `docs/PRODUCT.md` is still all "TBD") — the wins/losses stat added below is otherwise done.
Last_Action: Added a win/loss counter (`client/src/lib/matchResultStats.ts`,
`tranquil-match-results` key), recorded once per finished match from
`GameOver`'s existing mount-only effect (cooperative game — no per-seat
ambiguity, both players share the same result), displayed in the existing
shared `SettingsPanel`. Part of a cross-repo request also touching root
`muchogames` (Yatzy) and `coinchapp`. `npm run build:shared`, `npm run build
-w client`, and `npm test` all pass.
Next_Actions:
- Ask the user to sanity-check the new counter: play a local game to a win
  and to a loss, confirm both increment in `SettingsPanel` (from `Lobby`
  and from in-game).
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
- 2026-09-17 Added a win/loss counter (`client/src/lib/matchResultStats.ts`, `tranquil-match-results` key), recorded from `GameOver`'s mount effect, shown in `SettingsPanel`.
- 2026-09-09 Lobby/GameBoard headers now follow the back-top-left/options-top-right convention shared with the Bergamots-hub apps; language switch moved into SettingsPanel. See `Lobby.tsx`, `GameBoard.tsx`, `App.tsx`, `SettingsPanel.tsx`, `index.css`.
- 2026-09-08 Finish-card win flourish: light burst + card flies to top-right
  corner with a glow pulse + shimmer sound. See `FinishCardFlourish.tsx`,
  `GameBoard.tsx`, `sounds.ts`, `index.css`.
- 2026-09-06 Invite links no longer carry hub `?name=`/`?avatar=`. Partner does not inherit the host's identity. See ConnectingScreen / hubAvatar.
- 2026-09-06 Online GameBoard shows hub `?avatar=` thumb next to own name. Local/bot unchanged. See DECISIONS.

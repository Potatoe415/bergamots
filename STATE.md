# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Online backend on Vercel + Supabase. Create-room works in production. End-to-end two-tab play-test still pending.
Current_Goal: Fix the real mobile hand bug — it's horizontal card overflow, not vertical toolbar clipping (corrected diagnosis after re-reading the screenshots).
Last_Action: `Hand.tsx` card row now sizes cards via `ResizeObserver` (`client/src/lib/useElementWidth.ts`) instead of CSS Grid `1fr` tracks — computes exact px size to fit `cards.length` in the measured row width, floored at 44px (tappable), with `overflow-x-auto` fallback once that floor is hit (matters for 7-8 card start-discard hands). Verified the sizing formula for hand sizes 1–12 and row widths 256–366px via a standalone Node check — none overflow silently. Also kept the earlier `--app-height` viewport-height fix and the `position: fixed`→`static` revert (docs/DECISIONS.md). NOTHING before this had actually been committed/pushed (last real commit was 2026-09-05 18:07) — an earlier turn likely deployed a preview build directly, which is what the friend tested against.
Next_Actions:
- Commit + push so this actually deploys (nothing has reached git yet — verify with `git log` before telling the user it's live).
- Have the user's friend re-test on the real iPhone 17 Pro (Safari + Chrome) after this deploys — confirm all hand cards are visible/reachable (scroll if 8+), no more cut-off cards.
- Manually play-test online mode with two browser tabs: create room, join by code/link, play a few cards, reload, seat takeover.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine start_discard deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Recent_Changes:
- 2026-09-06 Bugfix: Real fix for the mobile hand bug — it's horizontal overflow (cards don't shrink to fit screen width; confirmed from screenshots showing hand-count badge > visible cards), not vertical toolbar clipping. `Hand.tsx` now sizes cards via `ResizeObserver` with a 44px floor + horizontal scroll fallback for large hands.
- 2026-09-06 Bugfix: Undid the `position: fixed` mobile-viewport fix (it made iOS clipping worse — needed app background/foreground instead of rotate). `#game-board` is normal-flow again, sized via JS-measured `--app-height`.
- 2026-09-05 UX: 2s delay before GameOver overlay; highlight last grid change on game end.
- 2026-09-05 Bugfix: iOS Safari hand clipped by toolbar — sync `--app-height` to visualViewport, shrink hand grid items.
- 2026-09-05 UX: Share-game-link button on the online create-room stepper (native share or clipboard fallback).
- 2026-08-03 UX: Optimistic local move application in online mode — the card lands on the grid on click instead of after the API round-trip.

# BACKLOG

Status: Living document. Always reflects current state.

---

## Now
- [ ] Provision Supabase project, run `supabase/migrations/0001_init.sql`, enable anonymous sign-ins.
- [ ] Push to GitHub and deploy on Vercel with the 4 env vars; verify a full game in prod.

## Next
- [ ] Manual Belote/Rebelote announcement during play (currently auto-detected).
- [ ] Smarter bot bidding/play (currently a greedy heuristic).
- [ ] Ad-hoc P2P: real-device pairing test (Chrome mDNS `.local` risk), client reconnection, emoji/GIF over the data channel.
- [ ] Generalize `useP2PHost.ts`/`useP2PBouillaHost.ts`/`useP2PPresidentHost.ts`/`useP2PBataillecorseHost.ts` (now 4 parallel host files, never generalized even at N=3 - accepted trade-off when Président shipped, see DECISIONS 2026-09-10).
- [ ] La Bataille Corse: real 2-device online/ad-hoc reflex-race test (only smoke-tested solo via one browser so far - see DECISIONS 2026-09-16).

## Later
- [ ] Optional accounts + stats/leaderboard.
- [ ] Rule variants and table chat.

## Blocked
- [ ] Prod verification blocked on user's Supabase + Vercel + GitHub setup.

## Done
- [x] Restyle the mobile game table to match the provided visual reference.
- [x] Bootstrap context architecture.
- [x] Scaffold Next.js + TS + Tailwind + Vitest + Supabase deps, git init.
- [x] Pure rules engine (cards, deal, bidding, trick, scoring, bots, redact) + 36 tests.
- [x] Supabase schema + RLS + realtime tick + browser/server/service clients.
- [x] Authoritative Server Actions (create/join/fill/start/bid/play/nextDeal/getView).
- [x] Realtime hook + lobby + mobile-first game table + bidding panel + deal/finish overlays.
- [x] Settings dashboard on home (target points, bot difficulty).
- [x] Runbook, README, product/tech/data-model docs.
- [x] Offline ad-hoc mode: WebRTC P2P host/client over local network with QR-code signaling (additive, online/local modes untouched).
- [x] Optimistic concurrency / version conflict handling on Server Actions (`updateVersioned` in `repo.ts`).
- [x] Reconnection/disconnect handling and "connected" status in the table UI (presence heartbeat + stale-turn auto-play fallback).
- [x] Giphy GIF reactions next to the emoji picker (online + local; search via server-only `GIPHY_API_KEY`).
- [x] Third game "Président" (Trou du cul): local/online/ad-hoc, revolution + forced-exchange mechanics, heuristic bot, cumulative finish-rank scoring.
- [x] Fixed: online Président (server-hosted, not ad-hoc) bot seats stalled forever on the first turn - `lib/client/useBotRunner.ts` had the same latent bug already found for la Bataille Corse, confirmed: `isActiveTurn` never matched Président's `"exchange"` phase, and its decide/submit path fell through to the Coinche ISMCTS brain for any non-`"bouilla"` game type on `"playing"`, so `submitBotMove` kept failing and retrying forever. Now dispatches to `decidePresidentAction`/`toPresidentMove` and recognizes both Président phases.
- [x] Dedicated splash background art for `/president` (`public/president-full.jpg`, watercolor "Le Président" illustration).
- [x] Fourth game "la Bataille Corse" (2 players, reflex): local/online/ad-hoc, figure/ace tribute challenges, double/sandwich slap race resolved by comparing each side's own locally-measured reaction time (never network arrival order), false-slap penalty. Seat count generalized (`seatCountFor`) since this is the first non-4-seat game.
- [x] La Bataille Corse table redesign (tap-the-pile-to-slap, tap-your-own-pile-to-play, deck-style stock piles, reaction-time readout) + configurable 32/54-card deck with jokers + dedicated splash art + taller home-grid tiles.
- [x] Fluid full-viewport table shell (all 4 games): drop the 460×720 phone column; cards `aspect-ratio 2/3` scaled with `svmin`.

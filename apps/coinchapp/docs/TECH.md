# TECH

Status: Living document. Never edit autonomously - confirm with user first.

---

Stack_Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
Stack_Backend: Next.js Server Actions (authoritative game logic)
Database: Supabase Postgres
Runtime: Node.js (Vercel serverless)
Package_Manager: npm
Hosting: Vercel
Authentication: Supabase anonymous sign-in (cookie session via @supabase/ssr)
Authorization: RLS denies direct client access to games/game_players; only the service_role (Server Actions) reads/writes authoritative state.
Security: Human hands stay redacted per seat. Bots run in the host client, which receives the bot seats' hands (trusted-runner model). The server stays authoritative: it validates every submitted move (human or bot) with the rules engine. La Bataille Corse's slap race extends this same trust model: `attemptSlap`'s `reactionMs` is self-reported by the caller's own client (elapsed time on that device), and the server only ever compares the two seats' reported values against each other - it cannot verify either one is honest.
Testing: Vitest (pure rules engines in lib/coinche, lib/bouilla, lib/president)
Deployment: Git push -> Vercel build (see docs/RUNBOOK.md)

Conventions:
- Language: English (code), French (user-facing copy)
- Naming: camelCase (TS), kebab-case (data-id attributes), snake_case (SQL)
- Formatting: default Next.js ESLint config
- Error_Handling: Server Actions throw Error with stable codes (e.g. "illegal_card"); UI shows the code/message.
- Logging: none custom yet

Architecture_Principles:
- Rules engine is pure and framework-agnostic (lib/coinche), unit-tested.
- Server is the single authority; the browser is a renderer + input.
- Realtime is a lightweight tick (game_events) that triggers a redacted refetch; no secret data flows over realtime.
- Bots run client-side in the host browser: when a bot seat is to move, the host decides from that seat's redacted view and submits the move like a human (submitBotMove). Any seated human can take over via "Become host" (games.host_user_id). The local solo game runs bots fully in-browser with no server.
- Files <= 300 lines, functions <= 30 lines, one responsibility per file.

Key_Modules:
- lib/coinche: cards, deal, bidding, trick, scoring, engine, bot, redact, types.
- lib/bouilla: cards, deal, trick, rounds, scoring, engine, bot, redact, types (Barbu-style, no bidding/trump).
- lib/president: cards, deal, combos, play, exchange, scoring, engine, bot, redact, types (shedding game, revolution + forced exchange).
- lib/bataillecorse: cards, deal, pattern, tribute, engine, bot, redact, types (2-player-only reflex game: figure/ace tribute challenges, double/sandwich slap race resolved by comparing each side's own locally-measured reaction time). Own dedicated online bot runner (`lib/client/useBataillecorseBotRunner.ts`) and local/ad-hoc hooks (`useLocalBataillecorseGame.ts`, `useP2PBataillecorseHost.ts`) - does not fit the other games' turn-based `runBotLoop`/`useBotRunner`/`useLocalCardGame` abstractions, since a slap is never gated by whose turn it is.
- lib/server: repo (data access), view (redaction + host botViews), actions-lobby (`seatCountFor` - 2 seats for bataillecorse, 4 for every other game), actions-game (submitBotMove, becomeHost, bataillecorse's flipCard/attemptSlap), slap-timer (bataillecorse-only stale-slap-window resolution, polled from getView like the idle-turn/round-gate timers).
- lib/supabase: client (browser), server (user + service clients).
- lib/client: auth (anon), useGameView (realtime hook), bot (browser brain), useBotRunner (host drives Coinche/Bouilla bots - not bataillecorse, see its own runner above), useLocalGame.

Open_Questions:
- Optimistic concurrency on version is naive (read-then-write); revisit if races appear.

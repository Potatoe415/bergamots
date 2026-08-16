-- Yatzy multiplayer room state.
-- Replaces the Firebase Realtime Database tree at `games/{code}`
-- (see public/games/yatsy/matchmaking.js, pre-migration).

create table if not exists public.yatzy_games (
  code text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'waiting' check (status in ('waiting', 'playing')),
  game_state jsonb,
  creator_token text,
  joiner_token text,
  version bigint not null default 0
);

-- Realtime "tick" signal: carries no game data, only enough to tell
-- subscribers to refetch the current state via the API.
create table if not exists public.yatzy_game_events (
  id bigint generated always as identity primary key,
  game_code text not null references public.yatzy_games (code) on delete cascade,
  version bigint not null,
  created_at timestamptz not null default now()
);

alter table public.yatzy_games enable row level security;
alter table public.yatzy_game_events enable row level security;

-- No policies on yatzy_games: the anon/authenticated Postgres roles get
-- zero access. Only the service_role key (used exclusively inside the
-- Vercel functions under api/yatsy/games/) can read or write this table.

-- yatzy_game_events only carries a game_code + version tick, so any
-- client may read it to drive realtime refetches.
create policy "read yatzy game events" on public.yatzy_game_events
  for select
  to anon, authenticated
  using (true);

alter publication supabase_realtime add table public.yatzy_game_events;

-- Hourly hard purge, independent of the app-level GAME_TTL_MS (3h) check
-- done in the API. Mirrors the pattern in coinchapp's 0001_init.sql.
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-expired-yatzy-games',
  '0 * * * *',
  $$delete from public.yatzy_games where created_at < now() - interval '48 hours'$$
);

-- Hub analytics events. Currently only game launches, recorded by api/track.js
-- and aggregated by api/admin/stats.js.
--
-- The `muchogames_` prefix follows the same namespacing rule as `yatzy_*`:
-- the Supabase project `multigames-db` is shared with coinchapp, so every
-- table must be prefixed to avoid collisions (see docs/DECISIONS.md 2026-08-16).

create table if not exists public.muchogames_events (
  id bigint generated always as identity primary key,
  type text not null default 'game_launch',
  game_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists muchogames_events_created_at_idx
  on public.muchogames_events (created_at desc);

create index if not exists muchogames_events_game_id_idx
  on public.muchogames_events (game_id);

alter table public.muchogames_events enable row level security;

-- No policies, same pattern as yatzy_games: the anon/authenticated Postgres
-- roles get zero access. Only the service_role key (used exclusively inside
-- api/track.js and api/admin/stats.js) can read or write this table.

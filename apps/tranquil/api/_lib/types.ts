import type { GameState, MonsterCount } from '@tranquillity/shared';

export type GameStatus = 'lobby' | 'playing' | 'finished';

/** Row shape of the shared `games` table (coinchapp's Supabase project),
 *  scoped to rows where game_type = 'tranquillity'. */
export interface GameRow {
  id: string;
  room_code: string;
  game_type: string;
  status: GameStatus;
  settings: { monsterCount: MonsterCount };
  state: GameState | null;
  version: number;
  host_user_id: string | null;
  turn_started_at: string;
  created_at: string;
}

/** Row shape of the shared `game_players` table. `team` has no meaning for
 *  Tranquillity (no teams) — kept only to satisfy the shared table's
 *  NOT NULL constraint, seat 0 = 'A', seat 1 = 'B'. */
export interface PlayerRow {
  id: string;
  game_id: string;
  seat: 0 | 1;
  user_id: string | null;
  display_name: string;
  is_bot: boolean;
  team: 'A' | 'B';
  last_seen_at: string;
  missed_turns_in_row: number;
  created_at: string;
}

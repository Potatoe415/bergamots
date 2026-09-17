import type { GameState } from '@tranquillity/shared';
import { getServiceClient } from './supabaseAdmin';
import { logDb } from './log';
import type { GameRow, GameStatus, PlayerRow } from './types';

export interface LoadedGame {
  game: GameRow;
  players: PlayerRow[];
}

/** Discriminator value for this app's rows in coinchapp's shared `games` table. */
export const GAME_TYPE = 'tranquillity';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GAME_TTL_MS = 48 * 60 * 60 * 1000;

/** Above this silence, a seat is treated as disconnected (eligible to be
 *  taken over by someone else joining with the room code). */
export const PRESENCE_STALE_MS = 30_000;

function activeCutoffIso(): string {
  return new Date(Date.now() - GAME_TTL_MS).toISOString();
}

export function randomRoomCode(length = 3): string {
  let code = '';
  for (let i = 0; i < length; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

export async function loadGame(gameId: string): Promise<LoadedGame> {
  logDb('query', `SELECT games + game_players WHERE id=${gameId}`);
  const supabase = getServiceClient();
  const [{ data: game, error }, { data: players }] = await Promise.all([
    supabase.from('games').select('*').eq('id', gameId).eq('game_type', GAME_TYPE).single(),
    supabase.from('game_players').select('*').eq('game_id', gameId).order('seat'),
  ]);
  if (error || !game) {
    logDb('query', `game ${gameId} not found`, error);
    throw new Error('game_not_found');
  }
  logDb('query', `loaded game ${gameId}`, { status: (game as GameRow).status, players: players?.length ?? 0 });
  return { game: game as GameRow, players: (players ?? []) as PlayerRow[] };
}

export async function findGameByCode(code: string): Promise<LoadedGame | null> {
  logDb('query', `SELECT games WHERE room_code=${code.toUpperCase()}`);
  const supabase = getServiceClient();
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('room_code', code.toUpperCase())
    .eq('game_type', GAME_TYPE)
    .gte('created_at', activeCutoffIso())
    .maybeSingle();
  if (!game) {
    logDb('query', `no room found for code ${code.toUpperCase()}`);
    return null;
  }
  return loadGame((game as GameRow).id);
}

export function seatOf(uid: string | null, players: PlayerRow[]): (0 | 1) | null {
  if (!uid) return null;
  const found = players.find((p) => p.user_id === uid);
  return found ? (found.seat as 0 | 1) : null;
}

export function isSeatLive(players: PlayerRow[], seat: number, now: number): boolean {
  const player = players.find((p) => p.seat === seat);
  if (!player) return false;
  return now - new Date(player.last_seen_at).getTime() < PRESENCE_STALE_MS;
}

export async function touchPresence(gameId: string, seat: number): Promise<void> {
  logDb('query', `UPDATE game_players.last_seen_at WHERE game_id=${gameId} AND seat=${seat}`);
  await getServiceClient()
    .from('game_players')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('game_id', gameId)
    .eq('seat', seat);
}

/** Optimistic-concurrency guarded update: only succeeds if `game.version`
 *  still matches the row in the DB. Always emits a `game_events` tick so
 *  the other seat's realtime subscription knows to refetch. */
async function updateVersioned(game: GameRow, patch: Record<string, unknown>): Promise<number> {
  const supabase = getServiceClient();
  const version = game.version + 1;
  logDb('query', `UPDATE games SET version=${version} WHERE id=${game.id} AND version=${game.version}`);
  const { data, error } = await supabase
    .from('games')
    .update({ ...patch, version })
    .eq('id', game.id)
    .eq('version', game.version)
    .select('id');
  if (error) {
    logDb('query', `update failed for game ${game.id}`, error);
    throw new Error('persist_failed');
  }
  if (!data || data.length === 0) {
    logDb('query', `version conflict for game ${game.id} (expected ${game.version})`);
    throw new Error('version_conflict');
  }
  await supabase.from('game_events').insert({ game_id: game.id, version });
  logDb('query', `game ${game.id} updated to version ${version}, tick emitted`);
  return version;
}

export async function persistGame(game: GameRow, state: GameState, status: GameStatus): Promise<number> {
  return updateVersioned(game, { state, status, turn_started_at: new Date().toISOString() });
}

/** Bump the version and emit a tick without changing game state (e.g. a
 *  seat takeover in the lobby). */
export async function touchGame(game: GameRow): Promise<number> {
  return updateVersioned(game, {});
}

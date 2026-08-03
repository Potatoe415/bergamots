import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeGame, type MonsterCount } from '@tranquillity/shared';
import { getUserId } from './_lib/auth';
import { getServiceClient } from './_lib/supabaseAdmin';
import { findGameByCode, isSeatLive, loadGame, persistGame, randomRoomCode, seatOf, touchGame, GAME_TYPE } from './_lib/repo';

const ALLOWED_MONSTER_COUNTS: MonsterCount[] = [0, 3, 4, 5];
const ROOM_CODE_REGEX = /^[A-Z0-9]{3}$/;

function cleanName(name: unknown): string {
  const trimmed = typeof name === 'string' ? name.trim().slice(0, 20) : '';
  return trimmed.length > 0 ? trimmed : 'Player';
}

function sanitizeMonsterCount(value: unknown): MonsterCount {
  return ALLOWED_MONSTER_COUNTS.includes(value as MonsterCount) ? (value as MonsterCount) : 0;
}

/** Starts the game once a second seat is occupied — mirrors the "two
 *  players — start a new game" step of the old Socket.IO join handler. */
async function startGameForFullRoom(gameId: string): Promise<void> {
  const loaded = await loadGame(gameId);
  const p0 = loaded.players.find((p) => p.seat === 0);
  const p1 = loaded.players.find((p) => p.seat === 1);
  if (!p0?.user_id || !p1?.user_id || loaded.game.state) return;

  const monsterCount = loaded.game.settings?.monsterCount ?? 0;
  const state = initializeGame(
    loaded.game.id,
    { id: p0.user_id, name: p0.display_name },
    { id: p1.user_id, name: p1.display_name },
    monsterCount,
  );
  await persistGame(loaded.game, state, 'playing');
}

/** Join an existing room by code: resume an already-held seat, take the
 *  free seat, or (if full) take over a stale/disconnected seat. */
async function handleJoin(uid: string, roomCode: string, name: string, res: VercelResponse): Promise<void> {
  const normalized = roomCode.trim().toUpperCase();
  if (!ROOM_CODE_REGEX.test(normalized)) {
    res.status(400).json({ error: 'invalid_room_code' });
    return;
  }

  const loaded = await findGameByCode(normalized);
  if (!loaded) {
    res.status(404).json({ error: 'room_not_found' });
    return;
  }

  const existingSeat = seatOf(uid, loaded.players);
  if (existingSeat !== null) {
    res.status(200).json({ gameId: loaded.game.id, roomCode: normalized, seat: existingSeat });
    return;
  }

  const supabase = getServiceClient();

  if (loaded.players.length === 0) {
    res.status(400).json({ error: 'room_has_no_host' });
    return;
  }

  if (loaded.players.length >= 2) {
    const now = Date.now();
    const stale = loaded.players.find((p) => !isSeatLive(loaded.players, p.seat, now));
    if (!stale) {
      res.status(409).json({ error: 'room_full' });
      return;
    }
    await supabase
      .from('game_players')
      .update({ user_id: uid, display_name: name, last_seen_at: new Date().toISOString() })
      .eq('game_id', loaded.game.id)
      .eq('seat', stale.seat);
    await touchGame(loaded.game);
    res.status(200).json({ gameId: loaded.game.id, roomCode: normalized, seat: stale.seat });
    return;
  }

  const freeSeat: 0 | 1 = loaded.players[0].seat === 0 ? 1 : 0;
  await supabase.from('game_players').insert({
    game_id: loaded.game.id,
    seat: freeSeat,
    user_id: uid,
    display_name: name,
    is_bot: false,
    team: freeSeat === 0 ? 'A' : 'B',
  });
  await startGameForFullRoom(loaded.game.id);
  res.status(200).json({ gameId: loaded.game.id, roomCode: normalized, seat: freeSeat });
}

/** Create a brand-new room with the caller as seat 0. */
async function handleCreate(uid: string, name: string, monsterCount: unknown, res: VercelResponse): Promise<void> {
  const supabase = getServiceClient();
  const mc = sanitizeMonsterCount(monsterCount);

  let code = randomRoomCode();
  for (let attempt = 0; attempt < 5 && (await findGameByCode(code)); attempt++) code = randomRoomCode();

  const { data: gameRow, error: gameError } = await supabase
    .from('games')
    .insert({ room_code: code, game_type: GAME_TYPE, status: 'lobby', settings: { monsterCount: mc }, version: 0 })
    .select('id')
    .single();
  if (gameError || !gameRow) {
    res.status(500).json({ error: 'create_failed' });
    return;
  }

  const gameId = (gameRow as { id: string }).id;
  const { error: seatError } = await supabase
    .from('game_players')
    .insert({ game_id: gameId, seat: 0, user_id: uid, display_name: name, is_bot: false, team: 'A' });
  if (seatError) {
    await supabase.from('games').delete().eq('id', gameId);
    res.status(500).json({ error: 'create_failed' });
    return;
  }

  res.status(200).json({ gameId, roomCode: code, seat: 0 });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const uid = await getUserId(req.headers);
  if (!uid) {
    res.status(401).json({ error: 'not_authenticated' });
    return;
  }

  const { roomCode, playerName, monsterCount } = (req.body ?? {}) as Record<string, unknown>;
  const name = cleanName(playerName);

  if (typeof roomCode === 'string' && roomCode.length > 0) {
    await handleJoin(uid, roomCode, name, res);
  } else {
    await handleCreate(uid, name, monsterCount, res);
  }
}

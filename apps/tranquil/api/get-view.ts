import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildClientState } from '@tranquillity/shared';
import { getUserId } from './_lib/auth';
import { logServer } from './_lib/log';
import { loadGame, seatOf, touchPresence } from './_lib/repo';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const uid = await getUserId(req.headers);
  if (!uid) {
    logServer('sync', 'GET /api/get-view rejected: not authenticated');
    res.status(401).json({ error: 'not_authenticated' });
    return;
  }

  const gameId = typeof req.query.gameId === 'string' ? req.query.gameId : '';
  if (!gameId) {
    res.status(400).json({ error: 'missing_game_id' });
    return;
  }
  logServer('sync', `fetching view for game ${gameId}`, { uid });

  let loaded;
  try {
    loaded = await loadGame(gameId);
  } catch {
    logServer('sync', `game ${gameId} not found`);
    res.status(404).json({ error: 'game_not_found' });
    return;
  }

  const mySeat = seatOf(uid, loaded.players);
  if (mySeat === null) {
    logServer('sync', `caller ${uid} is not seated in game ${gameId}`);
    res.status(403).json({ error: 'not_in_game' });
    return;
  }
  await touchPresence(gameId, mySeat);

  if (loaded.game.status === 'lobby' || !loaded.game.state) {
    logServer('sync', `game ${gameId} still waiting (lobby)`);
    res.status(200).json({ status: 'waiting', roomCode: loaded.game.room_code, clientState: null });
    return;
  }

  const clientState = buildClientState(loaded.game.state, mySeat);
  logServer('sync', `game ${gameId} view ready`, { status: loaded.game.status, seat: mySeat });
  res.status(200).json({ status: loaded.game.status, roomCode: loaded.game.room_code, clientState });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildClientState, type GameState, type MoveResult } from '@tranquillity/shared';
import { getUserId } from './auth';
import { loadGame, persistGame, seatOf } from './repo';

type ApplyFn = (state: GameState, seat: 0 | 1, body: Record<string, unknown>) => MoveResult;

/** Shared plumbing for every game-mutation endpoint: authenticate, load the
 *  game, resolve the caller's seat, apply the pure engine move, persist with
 *  optimistic concurrency, and return the caller's own fresh redacted view.
 *  The other seat learns about the move via the `game_events` realtime tick
 *  that `persistGame` emits. */
export async function handleMove(
  req: VercelRequest,
  res: VercelResponse,
  apply: ApplyFn,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const uid = await getUserId(req.headers);
  if (!uid) {
    res.status(401).json({ error: 'not_authenticated' });
    return;
  }

  const { gameId, ...body } = (req.body ?? {}) as Record<string, unknown>;
  if (!gameId || typeof gameId !== 'string') {
    res.status(400).json({ error: 'missing_game_id' });
    return;
  }

  let loaded;
  try {
    loaded = await loadGame(gameId);
  } catch {
    res.status(404).json({ error: 'game_not_found' });
    return;
  }

  const seat = seatOf(uid, loaded.players);
  if (seat === null) {
    res.status(403).json({ error: 'not_in_game' });
    return;
  }
  if (!loaded.game.state) {
    res.status(409).json({ error: 'game_not_started' });
    return;
  }

  const result = apply(loaded.game.state, seat, body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const status = result.state.phase === 'won' || result.state.phase === 'lost' ? 'finished' : 'playing';
  await persistGame(loaded.game, result.state, status);

  res.status(200).json({ clientState: buildClientState(result.state, seat) });
}

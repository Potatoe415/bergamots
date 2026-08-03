import type { ClientGameState, MonsterCount } from '@tranquillity/shared';
import { getAccessToken } from './supabase';
import { logApp } from './log';

// Always same-origin: in dev, vite.config.ts proxies /api to `vercel dev`;
// in production, the client and /api functions share the same Vercel domain.
async function request<T>(path: string, step: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  logApp(step, `→ ${options.method ?? 'GET'} ${path}`);
  const res = await fetch(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    logApp(step, `← ${path} failed (${res.status})`, body);
    throw new Error(body.error ?? 'request_failed');
  }
  logApp(step, `← ${path} ok`, body);
  return body as T;
}

export interface JoinResponse {
  gameId: string;
  roomCode: string;
  seat: 0 | 1;
}

export interface ViewResponse {
  status: 'waiting' | 'playing' | 'finished';
  roomCode: string;
  clientState: ClientGameState | null;
}

export interface MoveResponse {
  clientState: ClientGameState;
}

export function createRoom(playerName: string, monsterCount: MonsterCount): Promise<JoinResponse> {
  return request('/api/join', 'create_room', { method: 'POST', body: JSON.stringify({ playerName, monsterCount }) });
}

export function joinRoom(roomCode: string, playerName: string): Promise<JoinResponse> {
  return request('/api/join', 'join_room', { method: 'POST', body: JSON.stringify({ roomCode, playerName }) });
}

export function getView(gameId: string): Promise<ViewResponse> {
  return request(`/api/get-view?gameId=${encodeURIComponent(gameId)}`, 'sync');
}

export function playCard(
  gameId: string,
  cardId: string,
  position: number,
  discardCardIds: string[],
): Promise<MoveResponse> {
  return request('/api/play-card', 'play_card', { method: 'POST', body: JSON.stringify({ gameId, cardId, position, discardCardIds }) });
}

export function discardTwo(gameId: string, cardIds: [string, string]): Promise<MoveResponse> {
  return request('/api/discard-two', 'discard_two', { method: 'POST', body: JSON.stringify({ gameId, cardIds }) });
}

export function contributeStartDiscard(gameId: string, cardIds: string[]): Promise<MoveResponse> {
  return request('/api/contribute-start-discard', 'contribute_start_discard', { method: 'POST', body: JSON.stringify({ gameId, cardIds }) });
}

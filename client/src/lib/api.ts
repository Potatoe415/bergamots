import type { ClientGameState, MonsterCount } from '@tranquillity/shared';
import { getAccessToken } from './supabase';

// Always same-origin: in dev, vite.config.ts proxies /api to `vercel dev`;
// in production, the client and /api functions share the same Vercel domain.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'request_failed');
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
  return request('/api/join', { method: 'POST', body: JSON.stringify({ playerName, monsterCount }) });
}

export function joinRoom(roomCode: string, playerName: string): Promise<JoinResponse> {
  return request('/api/join', { method: 'POST', body: JSON.stringify({ roomCode, playerName }) });
}

export function getView(gameId: string): Promise<ViewResponse> {
  return request(`/api/get-view?gameId=${encodeURIComponent(gameId)}`);
}

export function playCard(
  gameId: string,
  cardId: string,
  position: number,
  discardCardIds: string[],
): Promise<MoveResponse> {
  return request('/api/play-card', { method: 'POST', body: JSON.stringify({ gameId, cardId, position, discardCardIds }) });
}

export function discardTwo(gameId: string, cardIds: [string, string]): Promise<MoveResponse> {
  return request('/api/discard-two', { method: 'POST', body: JSON.stringify({ gameId, cardIds }) });
}

export function contributeStartDiscard(gameId: string, cardIds: string[]): Promise<MoveResponse> {
  return request('/api/contribute-start-discard', { method: 'POST', body: JSON.stringify({ gameId, cardIds }) });
}

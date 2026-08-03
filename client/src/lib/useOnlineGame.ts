import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientGameState, MonsterCount } from '@tranquillity/shared';
import { ensureAnonAuth, supabase } from './supabase';
import * as api from './api';

export interface OnlineGameState {
  clientState: ClientGameState | null;
  roomCode: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  error: string | null;
}

const IDLE_STATE: OnlineGameState = { clientState: null, roomCode: null, connectionStatus: 'idle', error: null };

/** Safety-net poll: catches any missed tick even if the realtime channel and
 *  its reconnection logic both fail silently. */
const POLL_MS = 15000;
const RESUBSCRIBE_DELAY_MS = 1000;
const BAD_STATUSES = new Set(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']);

type Channel = ReturnType<typeof supabase.channel>;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'unknown_error';
}

/** Manages an online Tranquillity game over Supabase: anonymous identity,
 *  a realtime "tick" subscription that triggers a redacted refetch (mirrors
 *  coinchapp's useGameView), and a localStorage-persisted session that
 *  survives reloads. Replaces the old Socket.IO push model. */
export function useOnlineGame() {
  const [online, setOnline] = useState<OnlineGameState>(IDLE_STATE);
  const gameIdRef = useRef<string | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const resubscribeRef = useRef<() => void>(() => {});

  const refetch = useCallback(async () => {
    const gameId = gameIdRef.current;
    if (!gameId) return;
    try {
      const view = await api.getView(gameId);
      setOnline((prev) => ({
        ...prev,
        roomCode: view.roomCode,
        clientState: view.clientState,
        connectionStatus: 'connected',
        error: null,
      }));
    } catch (e) {
      setOnline((prev) => ({ ...prev, connectionStatus: 'error', error: errorMessage(e) }));
    }
  }, []);

  const resubscribe = useCallback(() => {
    if (channelRef.current) void supabase.removeChannel(channelRef.current);
    const gameId = gameIdRef.current;
    if (!gameId) return;
    channelRef.current = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_events', filter: `game_id=eq.${gameId}` },
        () => void refetch(),
      )
      .on('broadcast', { event: 'tick' }, () => void refetch())
      .subscribe((status) => {
        if (BAD_STATUSES.has(status)) setTimeout(() => resubscribeRef.current(), RESUBSCRIBE_DELAY_MS);
      });
  }, [refetch]);

  useEffect(() => {
    resubscribeRef.current = resubscribe;
  }, [resubscribe]);

  const attach = useCallback(
    (gameId: string, roomCode: string) => {
      gameIdRef.current = gameId;
      localStorage.setItem('tranquillity_gameId', gameId);
      localStorage.setItem('tranquillity_room', roomCode);
      setOnline((prev) => ({ ...prev, roomCode, connectionStatus: 'connected', error: null }));
      resubscribe();
      void refetch();
    },
    [refetch, resubscribe],
  );

  const createRoom = useCallback(
    async (playerName: string, monsterCount: MonsterCount = 0) => {
      localStorage.setItem('tranquillity_name', playerName);
      setOnline((prev) => ({ ...prev, connectionStatus: 'connecting', error: null }));
      try {
        await ensureAnonAuth();
        const res = await api.createRoom(playerName, monsterCount);
        attach(res.gameId, res.roomCode);
      } catch (e) {
        setOnline((prev) => ({ ...prev, connectionStatus: 'error', error: errorMessage(e) }));
      }
    },
    [attach],
  );

  const joinRoom = useCallback(
    async (roomCode: string, playerName: string) => {
      localStorage.setItem('tranquillity_name', playerName);
      setOnline((prev) => ({ ...prev, connectionStatus: 'connecting', error: null }));
      try {
        await ensureAnonAuth();
        const res = await api.joinRoom(roomCode, playerName);
        attach(res.gameId, res.roomCode);
      } catch (e) {
        setOnline((prev) => ({ ...prev, connectionStatus: 'error', error: errorMessage(e) }));
      }
    },
    [attach],
  );

  // Resume a saved session on mount (survives reload/relaunch).
  useEffect(() => {
    const savedGameId = localStorage.getItem('tranquillity_gameId');
    if (!savedGameId) return;
    gameIdRef.current = savedGameId;
    setOnline((prev) => ({ ...prev, connectionStatus: 'connecting' }));
    void (async () => {
      await ensureAnonAuth();
      resubscribe();
      await refetch();
    })();
    // Runs once on mount only — resubscribe/refetch are stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backstop for missed events: re-sync whenever the tab/network comes back,
  // plus a low-frequency poll in case even that goes unnoticed.
  useEffect(() => {
    const onWake = () => {
      void refetch();
      resubscribeRef.current();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') onWake();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onWake);
    const poll = setInterval(() => void refetch(), POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onWake);
      clearInterval(poll);
    };
  }, [refetch]);

  /** Tell the peer to refetch immediately via a fast broadcast, instead of
   *  waiting for the slower postgres_changes tick. */
  const notifyPeer = useCallback(() => {
    void channelRef.current?.send({ type: 'broadcast', event: 'tick', payload: {} });
  }, []);

  const playCard = useCallback(
    async (cardId: string, position: number, discardCardIds: string[]) => {
      const gameId = gameIdRef.current;
      if (!gameId) return;
      try {
        const res = await api.playCard(gameId, cardId, position, discardCardIds);
        setOnline((prev) => ({ ...prev, clientState: res.clientState }));
        notifyPeer();
      } catch (e) {
        setOnline((prev) => ({ ...prev, error: errorMessage(e) }));
      }
    },
    [notifyPeer],
  );

  const discardTwo = useCallback(
    async (cardIds: [string, string]) => {
      const gameId = gameIdRef.current;
      if (!gameId) return;
      try {
        const res = await api.discardTwo(gameId, cardIds);
        setOnline((prev) => ({ ...prev, clientState: res.clientState }));
        notifyPeer();
      } catch (e) {
        setOnline((prev) => ({ ...prev, error: errorMessage(e) }));
      }
    },
    [notifyPeer],
  );

  const contributeStartDiscard = useCallback(
    async (cardIds: string[]) => {
      const gameId = gameIdRef.current;
      if (!gameId) return;
      try {
        const res = await api.contributeStartDiscard(gameId, cardIds);
        setOnline((prev) => ({ ...prev, clientState: res.clientState }));
        notifyPeer();
      } catch (e) {
        setOnline((prev) => ({ ...prev, error: errorMessage(e) }));
      }
    },
    [notifyPeer],
  );

  const leave = useCallback(() => {
    if (channelRef.current) void supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    gameIdRef.current = null;
    localStorage.removeItem('tranquillity_gameId');
    localStorage.removeItem('tranquillity_room');
    localStorage.removeItem('tranquillity_name');
    setOnline(IDLE_STATE);
  }, []);

  return { online, createRoom, joinRoom, playCard, discardTwo, contributeStartDiscard, leave };
}

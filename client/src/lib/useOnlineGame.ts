import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientGameState, MonsterCount } from '@tranquillity/shared';
import { ensureAnonAuth, supabase } from './supabase';
import * as api from './api';
import { logApp } from './log';
import { predictContributeStartDiscard, predictDiscardTwo, predictPlayCard } from './optimisticMove';

/** Which multi-step connection flow is in progress, so the UI can render a
 *  progress stepper (e.g. "Authenticating" -> "Creating room" -> "Loading"). */
export type ConnectionKind = 'create' | 'join' | 'resume' | null;
export type ConnectionStep = 'auth' | 'create_room' | 'join_room' | 'sync' | 'wait_partner' | null;

export interface OnlineGameState {
  clientState: ClientGameState | null;
  roomCode: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  connectionKind: ConnectionKind;
  connectionStep: ConnectionStep;
  error: string | null;
}

const IDLE_STATE: OnlineGameState = {
  clientState: null,
  roomCode: null,
  connectionStatus: 'idle',
  connectionKind: null,
  connectionStep: null,
  error: null,
};

/** Safety-net poll: catches any missed tick even if the realtime channel and
 *  its reconnection logic both fail silently. */
const POLL_MS = 15000;
const RESUBSCRIBE_DELAY_MS = 1000;
const BAD_STATUSES = new Set(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']);

type Channel = ReturnType<typeof supabase.channel>;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'unknown_error';
}

function applyView(prev: OnlineGameState, view: api.ViewResponse): OnlineGameState {
  const waiting = !view.clientState;
  return {
    ...prev,
    roomCode: view.roomCode,
    clientState: view.clientState,
    connectionStatus: 'connected',
    connectionKind: waiting ? 'create' : null,
    connectionStep: waiting ? 'wait_partner' : null,
    error: null,
  };
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
  // Guards against a refetch overwriting a locally-predicted move with a
  // snapshot taken before that move reached the database.
  const moveSeqRef = useRef(0);
  const movesInFlightRef = useRef(0);

  const refetch = useCallback(async () => {
    const gameId = gameIdRef.current;
    if (!gameId) return;
    const seq = moveSeqRef.current;
    try {
      const view = await api.getView(gameId);
      if (movesInFlightRef.current > 0 || moveSeqRef.current !== seq) {
        logApp('sync', 'game view discarded (own move is fresher)');
        return;
      }
      logApp('sync', 'game view fetched', { status: view.status, hasState: view.clientState !== null });
      setOnline((prev) => applyView(prev, view));
    } catch (e) {
      logApp('sync', 'game view fetch failed', e);
      setOnline((prev) => ({ ...prev, connectionStatus: 'error', error: errorMessage(e) }));
    }
  }, []);

  const resubscribe = useCallback(() => {
    if (channelRef.current) void supabase.removeChannel(channelRef.current);
    const gameId = gameIdRef.current;
    if (!gameId) return;
    logApp('realtime', `subscribing to game-${gameId}`);
    channelRef.current = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_events', filter: `game_id=eq.${gameId}` },
        () => void refetch(),
      )
      .on('broadcast', { event: 'tick' }, () => void refetch())
      .subscribe((status) => {
        logApp('realtime', `channel status: ${status}`);
        if (BAD_STATUSES.has(status)) setTimeout(() => resubscribeRef.current(), RESUBSCRIBE_DELAY_MS);
      });
  }, [refetch]);

  useEffect(() => {
    resubscribeRef.current = resubscribe;
  }, [resubscribe]);

  const attach = useCallback(
    (gameId: string, roomCode: string) => {
      logApp('sync', `attaching to game ${gameId}`, { roomCode });
      gameIdRef.current = gameId;
      localStorage.setItem('tranquillity_gameId', gameId);
      localStorage.setItem('tranquillity_room', roomCode);
      setOnline((prev) => ({ ...prev, roomCode, connectionStep: 'sync', error: null }));
      resubscribe();
      void refetch();
    },
    [refetch, resubscribe],
  );

  const createRoom = useCallback(
    async (playerName: string, monsterCount: MonsterCount = 0) => {
      logApp('auth', 'create room requested, authenticating…');
      localStorage.setItem('tranquillity_name', playerName);
      setOnline((prev) => ({ ...prev, connectionStatus: 'connecting', connectionKind: 'create', connectionStep: 'auth', error: null }));
      try {
        await ensureAnonAuth();
        logApp('create_room', 'authenticated, calling /api/join to create room…');
        setOnline((prev) => ({ ...prev, connectionStep: 'create_room' }));
        const res = await api.createRoom(playerName, monsterCount);
        attach(res.gameId, res.roomCode);
      } catch (e) {
        logApp('create_room', 'create room failed', e);
        setOnline((prev) => ({ ...prev, connectionStatus: 'error', connectionStep: null, error: errorMessage(e) }));
      }
    },
    [attach],
  );

  const joinRoom = useCallback(
    async (roomCode: string, playerName: string) => {
      logApp('auth', 'join room requested, authenticating…', { roomCode });
      localStorage.setItem('tranquillity_name', playerName);
      setOnline((prev) => ({ ...prev, connectionStatus: 'connecting', connectionKind: 'join', connectionStep: 'auth', error: null }));
      try {
        await ensureAnonAuth();
        logApp('join_room', 'authenticated, calling /api/join to join room…');
        setOnline((prev) => ({ ...prev, connectionStep: 'join_room' }));
        const res = await api.joinRoom(roomCode, playerName);
        attach(res.gameId, res.roomCode);
      } catch (e) {
        logApp('join_room', 'join room failed', e);
        setOnline((prev) => ({ ...prev, connectionStatus: 'error', connectionStep: null, error: errorMessage(e) }));
      }
    },
    [attach],
  );

  // Resume a saved session on mount (survives reload/relaunch).
  useEffect(() => {
    const savedGameId = localStorage.getItem('tranquillity_gameId');
    if (!savedGameId) return;
    logApp('auth', 'resuming saved session, authenticating…', { gameId: savedGameId });
    gameIdRef.current = savedGameId;
    setOnline((prev) => ({ ...prev, connectionStatus: 'connecting', connectionKind: 'resume', connectionStep: 'auth' }));
    void (async () => {
      await ensureAnonAuth();
      logApp('sync', 'authenticated, resubscribing and fetching game view…');
      setOnline((prev) => ({ ...prev, connectionStep: 'sync' }));
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

  /** Show the predicted result of my move immediately, then reconcile with the
   *  authoritative state returned by the server (or re-sync if it rejects it). */
  const sendMove = useCallback(
    async (
      predict: (state: ClientGameState) => ClientGameState | null,
      send: (gameId: string) => Promise<api.MoveResponse>,
    ) => {
      const gameId = gameIdRef.current;
      if (!gameId) return;
      moveSeqRef.current += 1;
      movesInFlightRef.current += 1;
      setOnline((prev) => {
        const predicted = prev.clientState && predict(prev.clientState);
        return predicted ? { ...prev, clientState: predicted } : prev;
      });
      try {
        const res = await send(gameId);
        setOnline((prev) => ({ ...prev, clientState: res.clientState }));
        notifyPeer();
      } catch (e) {
        setOnline((prev) => ({ ...prev, error: errorMessage(e) }));
        void refetch(); // drop the prediction, the server did not accept the move
      } finally {
        movesInFlightRef.current -= 1;
      }
    },
    [notifyPeer, refetch],
  );

  const playCard = useCallback(
    (cardId: string, position: number, discardCardIds: string[]) =>
      void sendMove(
        (state) => predictPlayCard(state, cardId, position, discardCardIds),
        (gameId) => api.playCard(gameId, cardId, position, discardCardIds),
      ),
    [sendMove],
  );

  const discardTwo = useCallback(
    (cardIds: [string, string]) =>
      void sendMove(
        (state) => predictDiscardTwo(state, cardIds),
        (gameId) => api.discardTwo(gameId, cardIds),
      ),
    [sendMove],
  );

  const contributeStartDiscard = useCallback(
    (cardIds: string[]) =>
      void sendMove(
        (state) => predictContributeStartDiscard(state, cardIds),
        (gameId) => api.contributeStartDiscard(gameId, cardIds),
      ),
    [sendMove],
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

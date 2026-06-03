import React, { useState, useEffect, useRef } from 'react';
import type { ClientGameState, GameJoinedPayload, WaitingPayload, ErrorPayload, GameState, MonsterCount } from '@tranquillity/shared';
import { useT, LanguageSwitcher } from './i18n';
import {
  initializeGame,
  buildClientState,
  applyPlayCard,
  applyDiscardTwo,
  applyContributeStartDiscard,
} from '@tranquillity/shared';
import { getSocket, disconnectSocket } from './socket';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import PassAndPlayTransition from './components/PassAndPlayTransition';

type AppMode = 'lobby' | 'local' | 'online';

// ── Local (pass-and-play) state ───────────────────────────────────────────────

interface LocalState {
  gameState: GameState;
  viewingAs: 0 | 1;
  showTransition: boolean;
  pendingPlayer: 0 | 1 | null; // player whose turn it will be after transition
}

// ── Online state ──────────────────────────────────────────────────────────────

interface OnlineState {
  clientState: ClientGameState | null;
  playerIndex: 0 | 1 | null;
  sessionToken: string | null;
  roomCode: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  error: string | null;
}

export default function App() {
  const t = useT();
  const [mode, setMode] = useState<AppMode>('lobby');
  const [local, setLocal] = useState<LocalState | null>(null);
  const [online, setOnline] = useState<OnlineState>({
    clientState: null,
    playerIndex: null,
    sessionToken: null,
    roomCode: null,
    connectionStatus: 'idle',
    error: null,
  });

  // ── Local mode ─────────────────────────────────────────────────────────────

  function startLocal(p1Name: string, p2Name: string, monsterCount: MonsterCount = 0) {
    localStorage.removeItem('tranquillity_token');
    localStorage.removeItem('tranquillity_name');
    const gameState = initializeGame('LOCAL', { id: 'p0', name: p1Name }, { id: 'p1', name: p2Name }, monsterCount);
    setLocal({ gameState, viewingAs: 0, showTransition: false, pendingPlayer: null });
    setMode('local');
  }

  function localClientState(): ClientGameState | null {
    if (!local) return null;
    return buildClientState(local.gameState, local.viewingAs);
  }

  function localPlayCard(cardId: string, position: number, discardCardIds: string[]) {
    if (!local) return;
    const result = applyPlayCard(local.gameState, local.viewingAs, cardId, position, discardCardIds);
    if (!result.ok) { alert(result.error); return; }

    const newState = result.state;
    const nextPlayer = newState.currentPlayerIndex;

    // If game over, just update (no transition needed)
    if (newState.phase === 'won' || newState.phase === 'lost') {
      setLocal(prev => prev ? { ...prev, gameState: newState } : null);
      return;
    }

    // If start_discard, current contributor is the active player — may stay on same player
    if (newState.phase === 'start_discard') {
      const contrib = newState.startDiscardState!.currentContributor;
      if (contrib !== local.viewingAs) {
        // Need transition to other player
        setLocal(prev => prev ? { ...prev, gameState: newState, pendingPlayer: contrib, showTransition: true } : null);
      } else {
        setLocal(prev => prev ? { ...prev, gameState: newState } : null);
      }
      return;
    }

    if (nextPlayer !== local.viewingAs) {
      setLocal(prev => prev ? { ...prev, gameState: newState, pendingPlayer: nextPlayer, showTransition: true } : null);
    } else {
      setLocal(prev => prev ? { ...prev, gameState: newState } : null);
    }
  }

  function localDiscardTwo(cardIds: [string, string]) {
    if (!local) return;
    const result = applyDiscardTwo(local.gameState, local.viewingAs, cardIds);
    if (!result.ok) { alert(result.error); return; }

    const newState = result.state;
    const nextPlayer = newState.currentPlayerIndex;

    if (newState.phase === 'won' || newState.phase === 'lost') {
      setLocal(prev => prev ? { ...prev, gameState: newState } : null);
      return;
    }

    if (nextPlayer !== local.viewingAs) {
      setLocal(prev => prev ? { ...prev, gameState: newState, pendingPlayer: nextPlayer, showTransition: true } : null);
    } else {
      setLocal(prev => prev ? { ...prev, gameState: newState } : null);
    }
  }

  function localContributeStartDiscard(cardIds: string[]) {
    if (!local) return;
    const result = applyContributeStartDiscard(local.gameState, local.viewingAs, cardIds);
    if (!result.ok) { alert(result.error); return; }

    const newState = result.state;

    if (newState.phase === 'playing' || newState.phase === 'won' || newState.phase === 'lost') {
      const nextPlayer = newState.currentPlayerIndex;
      if (nextPlayer !== local.viewingAs) {
        setLocal(prev => prev ? { ...prev, gameState: newState, pendingPlayer: nextPlayer, showTransition: true } : null);
      } else {
        setLocal(prev => prev ? { ...prev, gameState: newState } : null);
      }
      return;
    }

    // Still in start_discard
    const nextContrib = newState.startDiscardState!.currentContributor;
    if (nextContrib !== local.viewingAs) {
      setLocal(prev => prev ? { ...prev, gameState: newState, pendingPlayer: nextContrib, showTransition: true } : null);
    } else {
      setLocal(prev => prev ? { ...prev, gameState: newState } : null);
    }
  }

  function localHandleReady() {
    if (!local || local.pendingPlayer === null) return;
    setLocal(prev => prev ? { ...prev, viewingAs: prev.pendingPlayer!, showTransition: false, pendingPlayer: null } : null);
  }

  function localRematch() {
    if (!local) return;
    const gs = local.gameState;
    const p0 = gs.players[0];
    const p1 = gs.players[1];
    startLocal(p0.name, p1.name);
  }

  // ── Online mode ────────────────────────────────────────────────────────────

  const socketRef = useRef(getSocket());

  useEffect(() => {
    const sock = socketRef.current;

    sock.on('game_joined', (payload: GameJoinedPayload) => {
      // Store session token in localStorage for reconnection
      localStorage.setItem('tranquillity_token', payload.sessionToken);
      setOnline(prev => ({
        ...prev,
        clientState: payload.gameState,
        playerIndex: payload.playerIndex,
        sessionToken: payload.sessionToken,
        roomCode: payload.roomId,
        connectionStatus: 'connected',
        error: null,
      }));
      setMode('online');
    });

    sock.on('waiting', (payload: WaitingPayload) => {
      setOnline(prev => ({ ...prev, roomCode: payload.roomId, connectionStatus: 'connected' }));
    });

    sock.on('game_state', (payload: ClientGameState) => {
      setOnline(prev => ({ ...prev, clientState: payload }));
    });

    sock.on('error', (payload: ErrorPayload) => {
      setOnline(prev => ({ ...prev, error: payload.message, connectionStatus: 'error' }));
    });

    sock.on('connect_error', () => {
      setOnline(prev => ({ ...prev, connectionStatus: 'error', error: 'Cannot connect to server' }));
    });

    return () => {
      sock.off('game_joined');
      sock.off('waiting');
      sock.off('game_state');
      sock.off('error');
      sock.off('connect_error');
    };
  }, []);

  // Restore persisted session on mount
  useEffect(() => {
    const savedLocal = localStorage.getItem('tranquillity_local');
    if (savedLocal) {
      try {
        setLocal(JSON.parse(savedLocal) as LocalState);
        setMode('local');
        return;
      } catch {
        localStorage.removeItem('tranquillity_local');
      }
    }

    const token = localStorage.getItem('tranquillity_token');
    if (!token) return;
    const name = localStorage.getItem('tranquillity_name') ?? 'Player';
    setOnline(prev => ({ ...prev, connectionStatus: 'connecting' }));
    setMode('online');
    const sock = socketRef.current;
    sock.connect();
    sock.emit('join_game', { sessionToken: token, playerName: name });
  }, []);

  // Persist local state on every change
  useEffect(() => {
    if (local) localStorage.setItem('tranquillity_local', JSON.stringify(local));
  }, [local]);

  function createOnline(playerName: string, monsterCount: MonsterCount = 0) {
    localStorage.removeItem('tranquillity_local');
    localStorage.setItem('tranquillity_name', playerName);
    setOnline(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));
    const sock = socketRef.current;
    sock.connect();
    sock.emit('join_game', { playerName, monsterCount });
  }

  function joinOnline(roomCode: string, playerName: string) {
    localStorage.removeItem('tranquillity_local');
    localStorage.setItem('tranquillity_name', playerName);
    setOnline(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));
    const sock = socketRef.current;
    sock.connect();
    sock.emit('join_game', { roomId: roomCode, playerName });
  }

  function onlinePlayCard(cardId: string, position: number, discardCardIds: string[]) {
    socketRef.current.emit('play_card', { cardId, position, discardCardIds });
  }

  function onlineDiscardTwo(cardIds: [string, string]) {
    socketRef.current.emit('discard_two', { cardIds });
  }

  function onlineContributeStartDiscard(cardIds: string[]) {
    socketRef.current.emit('contribute_start_discard', { cardIds });
  }

  function goToMenu() {
    disconnectSocket();
    localStorage.removeItem('tranquillity_token');
    localStorage.removeItem('tranquillity_name');
    localStorage.removeItem('tranquillity_local');
    setMode('lobby');
    setLocal(null);
    setOnline({
      clientState: null, playerIndex: null, sessionToken: null,
      roomCode: null, connectionStatus: 'idle', error: null,
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const langSwitcher = (
    <div className="fixed top-3 right-3 z-[200]">
      <LanguageSwitcher />
    </div>
  );

  if (mode === 'lobby') {
    return (
      <>
        {langSwitcher}
        <Lobby
          onStartLocal={startLocal}
          onCreateOnline={createOnline}
          onJoinOnline={joinOnline}
          onCancelRoom={goToMenu}
          onlineRoomCode={online.roomCode ?? undefined}
          connectionStatus={online.connectionStatus}
          errorMessage={online.error ?? undefined}
        />
      </>
    );
  }

  if (mode === 'local' && local) {
    if (local.showTransition && local.pendingPlayer !== null) {
      const nextName = local.gameState.players[local.pendingPlayer].name;
      return (
        <>
          {langSwitcher}
          <PassAndPlayTransition nextPlayerName={nextName} onReady={localHandleReady} />
        </>
      );
    }

    const cs = localClientState();
    if (!cs) return null;

    return (
      <GameBoard
        gameState={cs}
        onPlayCard={localPlayCard}
        onDiscardTwo={localDiscardTwo}
        onContributeStartDiscard={localContributeStartDiscard}
        onRematch={localRematch}
        onMenu={goToMenu}
      />
    );
  }

  if (mode === 'online') {
    if (!online.clientState) {
      return (
        <>
          {langSwitcher}
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-spin">🌊</div>
              <p className="text-ocean-300">
                {online.roomCode
                  ? t('app.waitingPartner', { code: online.roomCode })
                  : t('app.connecting')}
              </p>
            </div>
          </div>
        </>
      );
    }

    return (
      <GameBoard
        gameState={online.clientState}
        onPlayCard={onlinePlayCard}
        onDiscardTwo={onlineDiscardTwo}
        onContributeStartDiscard={onlineContributeStartDiscard}
        onRematch={goToMenu}
        onMenu={goToMenu}
      />
    );
  }

  return null;
}

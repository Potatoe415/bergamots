import React, { useState, useEffect, useRef } from 'react';
import type { ClientGameState, GameJoinedPayload, WaitingPayload, ErrorPayload, KickedPayload, GameState, MonsterCount, Card } from '@tranquillity/shared';
import { useT, LanguageSwitcher } from './i18n';
import {
  initializeGame,
  buildClientState,
  applyPlayCard,
  applyDiscardTwo,
  applyContributeStartDiscard,
  chooseBotAction,
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
  pendingOpponentPlay: { card: Card; position: number } | null;
  vsBot: boolean; // when true, player 1 is an automated co-op bot
}

const BOT_NAME = 'Bot';
const BOT_PLAYER_INDEX = 1 as const;
const BOT_THINK_MS = 900;

// Who must take the next action (contributor during start_discard, otherwise the
// current player). Returns null when the game is over.
function nextLocalActor(s: GameState): 0 | 1 | null {
  if (s.phase === 'won' || s.phase === 'lost') return null;
  if (s.phase === 'start_discard') return s.startDiscardState!.currentContributor;
  return s.currentPlayerIndex;
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
  const [lobbyInitialRoom, setLobbyInitialRoom] = useState<string | undefined>(
    () => new URLSearchParams(window.location.search).get('room')?.toUpperCase() || undefined
  );
  const [online, setOnline] = useState<OnlineState>({
    clientState: null,
    playerIndex: null,
    sessionToken: null,
    roomCode: null,
    connectionStatus: 'idle',
    error: null,
  });

  // ── Local mode ─────────────────────────────────────────────────────────────

  function clearOnlineStorage() {
    localStorage.removeItem('tranquillity_token');
    localStorage.removeItem('tranquillity_name');
    localStorage.removeItem('tranquillity_room');
  }

  function startLocal(p1Name: string, p2Name: string, monsterCount: MonsterCount = 0) {
    clearOnlineStorage();
    const gameState = initializeGame('LOCAL', { id: 'p0', name: p1Name }, { id: 'p1', name: p2Name }, monsterCount);
    setLocal({ gameState, viewingAs: 0, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null, vsBot: false });
    setMode('local');
  }

  function startBot(playerName: string, monsterCount: MonsterCount = 0) {
    clearOnlineStorage();
    const gameState = initializeGame('LOCAL', { id: 'p0', name: playerName }, { id: 'p1', name: BOT_NAME }, monsterCount);
    setLocal({ gameState, viewingAs: 0, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null, vsBot: true });
    setMode('local');
  }

  function localClientState(): ClientGameState | null {
    if (!local) return null;
    return buildClientState(local.gameState, local.viewingAs);
  }

  // Commit a new local state, deciding whether a pass-and-play transition is
  // needed. In bot mode the human always keeps viewing as player 0 and the bot
  // effect drives player 1's turns — so no transition is ever shown.
  function advanceLocal(newState: GameState, opponentPlay: { card: Card; position: number } | null) {
    setLocal(prev => {
      if (!prev) return null;
      const actor = nextLocalActor(newState);
      if (prev.vsBot || actor === null || actor === prev.viewingAs) {
        return { ...prev, gameState: newState, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null };
      }
      return { ...prev, gameState: newState, showTransition: true, pendingPlayer: actor, pendingOpponentPlay: opponentPlay };
    });
  }

  function localPlayCard(cardId: string, position: number, discardCardIds: string[]) {
    if (!local) return;
    const result = applyPlayCard(local.gameState, local.viewingAs, cardId, position, discardCardIds);
    if (!result.ok) { alert(result.error); return; }
    const playedCard = local.gameState.players[local.viewingAs].hand.find(c => c.id === cardId) ?? null;
    const opponentPlay = playedCard && position >= 0 ? { card: playedCard, position } : null;
    advanceLocal(result.state, opponentPlay);
  }

  function localDiscardTwo(cardIds: [string, string]) {
    if (!local) return;
    const result = applyDiscardTwo(local.gameState, local.viewingAs, cardIds);
    if (!result.ok) { alert(result.error); return; }
    advanceLocal(result.state, null);
  }

  function localContributeStartDiscard(cardIds: string[]) {
    if (!local) return;
    const result = applyContributeStartDiscard(local.gameState, local.viewingAs, cardIds);
    if (!result.ok) { alert(result.error); return; }
    advanceLocal(result.state, null);
  }

  // Bot auto-play: whenever it is player 1's turn in a bot game, compute and
  // apply the bot's action after a short "thinking" delay.
  useEffect(() => {
    if (!local || !local.vsBot) return;
    if (nextLocalActor(local.gameState) !== BOT_PLAYER_INDEX) return;

    const timer = setTimeout(() => {
      setLocal(prev => {
        if (!prev || !prev.vsBot) return prev;
        if (nextLocalActor(prev.gameState) !== BOT_PLAYER_INDEX) return prev;
        const action = chooseBotAction(prev.gameState, BOT_PLAYER_INDEX);
        if (!action) return prev;
        let result;
        if (action.type === 'play') result = applyPlayCard(prev.gameState, BOT_PLAYER_INDEX, action.cardId, action.position, action.discardCardIds);
        else if (action.type === 'discard_two') result = applyDiscardTwo(prev.gameState, BOT_PLAYER_INDEX, action.cardIds);
        else result = applyContributeStartDiscard(prev.gameState, BOT_PLAYER_INDEX, action.cardIds);
        if (!result.ok) return prev;
        return { ...prev, gameState: result.state, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null };
      });
    }, BOT_THINK_MS);

    return () => clearTimeout(timer);
  }, [local]);

  function localHandleReady() {
    if (!local || local.pendingPlayer === null) return;
    setLocal(prev => prev ? { ...prev, viewingAs: prev.pendingPlayer!, showTransition: false, pendingPlayer: null } : null);
  }

  function localRematch() {
    if (!local) return;
    const gs = local.gameState;
    const [p0, p1] = gs.players;
    if (local.vsBot) startBot(p0.name, gs.monsterCount);
    else startLocal(p0.name, p1.name, gs.monsterCount);
  }

  // ── Online mode ────────────────────────────────────────────────────────────

  const socketRef = useRef(getSocket());

  useEffect(() => {
    const sock = socketRef.current;

    sock.on('game_joined', (payload: GameJoinedPayload) => {
      localStorage.setItem('tranquillity_token', payload.sessionToken);
      localStorage.setItem('tranquillity_room', payload.roomId);
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

    sock.on('kicked', (_payload: KickedPayload) => {
      disconnectSocket();
      localStorage.removeItem('tranquillity_token');
      localStorage.removeItem('tranquillity_name');
      setMode('lobby');
      setLocal(null);
      setOnline({
        clientState: null, playerIndex: null, sessionToken: null,
        roomCode: null, connectionStatus: 'error',
        error: t('app.kicked'),
      });
    });

    return () => {
      sock.off('game_joined');
      sock.off('waiting');
      sock.off('game_state');
      sock.off('error');
      sock.off('connect_error');
      sock.off('kicked');
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
    const savedRoom = localStorage.getItem('tranquillity_room');
    const name = localStorage.getItem('tranquillity_name') ?? 'Player';
    const sock = socketRef.current;

    // If the URL specifies a room different from the saved session, discard the
    // old session so the URL room takes priority (avoids being redirected back).
    const urlRoom = new URLSearchParams(window.location.search).get('room')?.toUpperCase();
    if (urlRoom && savedRoom && urlRoom !== savedRoom) {
      localStorage.removeItem('tranquillity_token');
      localStorage.removeItem('tranquillity_room');
    }

    const activeToken = urlRoom && savedRoom && urlRoom !== savedRoom ? null : token;

    if (activeToken) {
      setOnline(prev => ({ ...prev, connectionStatus: 'connecting' }));
      setMode('online');
      sock.connect();
      sock.emit('join_game', { sessionToken: activeToken, playerName: name });
      return;
    }

    // Rejoin via URL ?room= (no saved session, or session was for a different room)
    if (urlRoom) {
      if (localStorage.getItem('tranquillity_name')) {
        setOnline(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));
        setMode('online');
        sock.connect();
        sock.emit('join_game', { roomId: urlRoom, playerName: name });
      } else {
        setLobbyInitialRoom(urlRoom);
      }
    }
  }, []);

  // Sync URL ?room= param with current room code
  useEffect(() => {
    const url = new URL(window.location.href);
    if (online.roomCode) {
      url.searchParams.set('room', online.roomCode);
    } else {
      url.searchParams.delete('room');
    }
    window.history.replaceState(null, '', url.toString());
  }, [online.roomCode]);

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
    localStorage.removeItem('tranquillity_room');
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState(null, '', url.toString());
    setLobbyInitialRoom(undefined);
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
          onStartBot={startBot}
          onCreateOnline={createOnline}
          onJoinOnline={(code, name) => { setLobbyInitialRoom(undefined); joinOnline(code, name); }}
          onCancelRoom={goToMenu}
          onlineRoomCode={online.roomCode ?? undefined}
          connectionStatus={online.connectionStatus}
          errorMessage={online.error ?? undefined}
          initialRoomCode={lobbyInitialRoom}
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
        initialOpponentPlay={local.pendingOpponentPlay ?? undefined}
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
              <button
                onClick={goToMenu}
                className="mt-6 px-6 py-2 rounded-lg border border-ocean-400 text-ocean-300 hover:bg-ocean-800 transition-colors"
              >
                {t('app.cancel')}
              </button>
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

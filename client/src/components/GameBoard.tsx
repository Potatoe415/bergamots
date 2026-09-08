import React, { useState, useEffect, useRef } from 'react';
import type { ClientGameState, Card, LegalMove, GridCell } from '@tranquillity/shared';
import { useT, LanguageSwitcher } from '../i18n';
import Grid from './Grid';
import Hand from './Hand';
import GameOver from './GameOver';
import FinishCardFlourish from './FinishCardFlourish';
import SettingsPanel from './SettingsPanel';
import { useSettings } from '../settings';
import { playTurnSound } from '../sounds';
import { GAME_OVER_REVEAL_MS, findLastGridChange, useDelayedGameOver } from '../lib/endgameReveal';

interface Props {
  gameState: ClientGameState;
  onPlayCard: (cardId: string, position: number, discardCardIds: string[]) => void;
  onDiscardTwo: (cardIds: [string, string]) => void;
  onContributeStartDiscard: (cardIds: string[]) => void;
  onRematch: () => void;
  onMenu: () => void;
  /** Local (pass-and-play): card opponent just placed, shown immediately on mount */
  initialOpponentPlay?: { card: Card; position: number };
  /** Online only: tiny JPEG from the Bergamots hub `?avatar=` launch param. */
  selfAvatar?: string;
}

type UIMode = 'default' | 'selecting_discard_two';
type Translate = (key: string, vars?: Record<string, string | number>) => string;

function getStatusMessage(gameState: ClientGameState, t: Translate): string {
  const isMyTurn = gameState.currentPlayerIndex === gameState.myPlayerIndex;
  const me = gameState.players[gameState.myPlayerIndex];
  const opponent = gameState.players[gameState.myPlayerIndex === 0 ? 1 : 0];

  switch (gameState.phase) {
    case 'waiting':
      return t('status.waiting', { code: gameState.roomId });
    case 'won':
      return t('status.won');
    case 'lost':
      return t('status.lost');
    case 'finish_pending':
      return isMyTurn
        ? t('status.finishMonsterMine')
        : t('status.finishMonsterOther', { name: opponent.name });
    case 'start_discard':
      if (gameState.startDiscardState?.isMyTurnToContribute) {
        return t('status.startDiscardMine', { remaining: gameState.startDiscardState.remaining });
      }
      return t('status.startDiscardOther', { name: opponent.name });
    case 'playing':
      if (isMyTurn) {
        if (!gameState.startCardPlayed && me.handSize > 0 && gameState.myHand.some(c => c.type === 'start')) {
          return t('status.mustPlayStart');
        }
        return t('status.yourTurn');
      }
      return t('status.waitingForPlay', { name: opponent.name });
    default:
      return gameState.message;
  }
}

export default function GameBoard({ gameState, onPlayCard, onDiscardTwo, onContributeStartDiscard, onRematch, onMenu, initialOpponentPlay, selfAvatar }: Props) {
  const t = useT();
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [pendingPlay, setPendingPlay] = useState<{ card: Card; position: number; cost: number } | null>(null);
  const [uiMode, setUiMode] = useState<UIMode>('default');
  const [discardTwoSelected, setDiscardTwoSelected] = useState<Set<string>>(new Set());
  const [discardCostSelected, setDiscardCostSelected] = useState<Set<string>>(new Set());
  const [startDiscardSelected, setStartDiscardSelected] = useState<Set<string>>(new Set());

  const { myHand, grid, legalMoves, canDiscardTwo, phase, currentPlayerIndex, myPlayerIndex, startDiscardState, winner } = gameState;
  const isMyTurn = currentPlayerIndex === myPlayerIndex && (phase === 'playing' || phase === 'finish_pending');
  const opponent = gameState.players[myPlayerIndex === 0 ? 1 : 0];
  const me = gameState.players[myPlayerIndex];
  const movesForSelected: LegalMove[] = selectedCard ? legalMoves.filter(m => m.cardId === selectedCard.id) : [];
  const statusMessage = getStatusMessage(gameState, t);
  const showGameOver = useDelayedGameOver(winner);

  // ── Finish-card win flourish ────────────────────────────────────────────────
  // The finish card can only be played from 'playing' (never from 'finish_pending' —
  // see gameEngine). So a 'playing' → 'won' transition is exactly the moment the
  // finish card is played as the winning last card, with no monsters left to resolve.
  const [showFinishFlourish, setShowFinishFlourish] = useState(false);
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (prevPhase === 'playing' && phase === 'won') setShowFinishFlourish(true);
    else if (phase !== 'won') setShowFinishFlourish(false);
  }, [phase]);

  // ── Opponent play preview ───────────────────────────────────────────────────
  const [opponentPlay, setOpponentPlay] = useState<{ card: Card; position: number } | null>(
    initialOpponentPlay ?? null
  );
  const prevGridRef = useRef<GridCell[]>(grid);
  const prevIsMyTurnRef = useRef(isMyTurn);
  const prevWinnerRef = useRef(winner);
  const opponentPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashGridChange(play: { card: Card; position: number }, ms = GAME_OVER_REVEAL_MS) {
    if (opponentPlayTimerRef.current) clearTimeout(opponentPlayTimerRef.current);
    setOpponentPlay(play);
    opponentPlayTimerRef.current = setTimeout(() => {
      setOpponentPlay(null);
      opponentPlayTimerRef.current = null;
    }, ms);
  }

  // Local mode: initialOpponentPlay is set on mount — start auto-clear timer
  useEffect(() => {
    if (!initialOpponentPlay) return;
    flashGridChange(initialOpponentPlay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the last grid change when the turn flips to us, or when the game
  // just ended (the turn never flips, so the last tile would otherwise vanish
  // under the overlay).
  useEffect(() => {
    const wasMyTurn = prevIsMyTurnRef.current;
    prevIsMyTurnRef.current = isMyTurn;
    const prevGrid = prevGridRef.current;
    prevGridRef.current = grid;
    const justEnded = Boolean(winner) && !prevWinnerRef.current;
    prevWinnerRef.current = winner;

    if (!(isMyTurn && !wasMyTurn) && !justEnded) return;
    const change = findLastGridChange(grid, prevGrid);
    if (!change) return;
    flashGridChange(change);
  }, [isMyTurn, grid, winner]);

  useEffect(() => () => {
    if (opponentPlayTimerRef.current) clearTimeout(opponentPlayTimerRef.current);
  }, []);

  // ── Sound on turn start ─────────────────────────────────────────────────────
  const prevIsMyTurnSoundRef = useRef(isMyTurn);
  useEffect(() => {
    const was = prevIsMyTurnSoundRef.current;
    prevIsMyTurnSoundRef.current = isMyTurn;
    if (isMyTurn && !was && settings.soundOnMyTurn) playTurnSound();
  }, [isMyTurn, settings.soundOnMyTurn]);

  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!startDiscardState?.isMyTurnToContribute) setStartDiscardSelected(new Set());
  }, [startDiscardState?.isMyTurnToContribute]);

  // Clear all selection state on every phase transition so stale `pendingPlay`,
  // `selectedCard`, etc. from the playing phase never bleed into start_discard.
  useEffect(() => {
    setSelectedCard(null);
    setPendingPlay(null);
    setUiMode('default');
    setDiscardCostSelected(new Set());
    setDiscardTwoSelected(new Set());
  }, [phase]);

  function toggleDiscardCostCard(card: Card) {
    if (!pendingPlay || card.id === pendingPlay.card.id || card.type === 'monster') return;
    setDiscardCostSelected(prev => {
      const next = new Set(prev);
      if (next.has(card.id)) { next.delete(card.id); return next; }
      if (next.size < pendingPlay.cost) { next.add(card.id); return next; }
      return prev;
    });
  }

  function toggleStartDiscardCard(card: Card) {
    if (!startDiscardState || card.type === 'monster') return;
    const max = Math.min(startDiscardState.remaining, myHand.length);
    setStartDiscardSelected(prev => {
      const next = new Set(prev);
      if (next.has(card.id)) { next.delete(card.id); return next; }
      if (next.size < max) { next.add(card.id); return next; }
      return prev;
    });
  }

  function toggleDiscardTwoCard(card: Card) {
    const next = new Set(discardTwoSelected);
    if (next.has(card.id)) { next.delete(card.id); }
    else if (next.size < 2) { next.add(card.id); }
    setDiscardTwoSelected(next);
  }

  function handleCardClick(card: Card) {
    if (startDiscardState?.isMyTurnToContribute) { toggleStartDiscardCard(card); return; }
    if (pendingPlay) { toggleDiscardCostCard(card); return; }
    if (!isMyTurn) return;
    if (uiMode === 'selecting_discard_two') { toggleDiscardTwoCard(card); return; }
    if (card.type === 'start' && legalMoves.some(m => m.cardId === card.id && m.position === -1)) { setSelectedCard(null); onPlayCard(card.id, -1, []); return; }
    if (card.type === 'finish' && legalMoves.some(m => m.cardId === card.id && m.position === -1)) { setSelectedCard(null); onPlayCard(card.id, -1, []); return; }
    setSelectedCard(prev => prev?.id === card.id ? null : card);
  }

  function handleCellClick(pos: number) {
    if (!selectedCard || !isMyTurn) return;
    const move = movesForSelected.find(m => m.position === pos);
    if (!move) return;
    if (move.discardCost === 0) {
      if (selectedCard.type === 'monster') {
        flashGridChange({ card: selectedCard, position: pos }, 700);
      }
      onPlayCard(selectedCard.id, pos, []);
      setSelectedCard(null);
    } else {
      setPendingPlay({ card: selectedCard, position: pos, cost: move.discardCost });
      setDiscardCostSelected(new Set());
      setSelectedCard(null);
    }
  }

  function handleDiscardCostConfirm() {
    if (!pendingPlay || discardCostSelected.size !== pendingPlay.cost) return;
    onPlayCard(pendingPlay.card.id, pendingPlay.position, [...discardCostSelected]);
    setPendingPlay(null);
    setDiscardCostSelected(new Set());
  }

  function handleDiscardTwoConfirm() {
    const ids = [...discardTwoSelected];
    if (ids.length !== 2) return;
    onDiscardTwo([ids[0], ids[1]]);
    setDiscardTwoSelected(new Set());
    setUiMode('default');
  }

  const inSelectionMode = !!pendingPlay || uiMode === 'selecting_discard_two' || !!startDiscardState?.isMyTurnToContribute;

  const monsterIds = new Set(myHand.filter(c => c.type === 'monster').map(c => c.id));
  const handNonSelectableIds: Set<string> | undefined = pendingPlay
    ? new Set([pendingPlay.card.id, ...monsterIds])
    : startDiscardState?.isMyTurnToContribute ? monsterIds
    : undefined;

  const handAdditionalSelected = pendingPlay ? discardCostSelected
    : uiMode === 'selecting_discard_two' ? discardTwoSelected
    : startDiscardState?.isMyTurnToContribute ? startDiscardSelected
    : undefined;

  const startDiscardMax = startDiscardState ? Math.min(startDiscardState.remaining, myHand.length) : 0;
  // Each player must contribute enough cards to bring their own hand back to 5.
  // Capped by remaining so it never exceeds what's left to discard.
  const startDiscardMin = startDiscardState
    ? Math.min(Math.max(0, myHand.length - 5), startDiscardState.remaining)
    : 0;

  return (
    <div
      id="game-board"
      className="w-full overflow-hidden flex flex-col bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950"
      style={{ height: 'var(--app-height, 100svh)' }}
    >
      {/* Opponent info bar */}
      <header id="game-header" className="bg-ocean-900/80 border-b border-ocean-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenu}
            title={t('game.backToMenu')}
            className="text-ocean-400 hover:text-white transition-colors p-0.5 -ml-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            title={t('settings.title')}
            className="text-ocean-400 hover:text-white transition-colors p-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${opponent.isCurrentPlayer ? 'bg-green-400 animate-pulse' : 'bg-ocean-600'}`} />
            <span className="font-semibold text-white text-sm">{opponent.name}</span>
          </div>
          <div className="flex gap-4 text-xs text-ocean-400">
            <span title={t('game.hand')}>🤚 <strong className="text-white">{opponent.handSize}</strong></span>
            <span title={t('game.deck')}>🃏 <strong className="text-white">{opponent.deckSize}</strong></span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Cells filled indicator */}
      <div className="shrink-0 text-xs text-white/40 text-center pt-1">
        {grid.filter(c => c.card).length} / 36
      </div>

      {/* Grid */}
      <div id="game-canvas" className="flex-1 min-h-0 px-2 pt-0.5 grid place-items-center overflow-hidden [container-type:size]">
        <Grid
          grid={grid}
          legalMoves={movesForSelected}
          selectedCard={selectedCard}
          onCellClick={handleCellClick}
          opponentPlayPosition={opponentPlay?.position}
          pendingPlayCard={pendingPlay?.card}
          pendingPlayPosition={pendingPlay?.position}
        />
      </div>

      {/* Start card indicator */}
      <div className="shrink-0 px-4 pt-1 flex items-center gap-2">
        <div className={[
          'px-3 py-0.5 rounded-full text-xs font-semibold border',
          gameState.startCardPlayed
            ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
            : 'bg-ocean-800/50 border-ocean-700/40 text-ocean-400',
        ].join(' ')}>
          {gameState.startCardPlayed ? t('game.startPlayed') : t('game.startPending')}
        </div>
      </div>

      {/* finish_pending banner */}
      {phase === 'finish_pending' && (
        <div className="shrink-0 bg-red-950/80 border-b border-red-800/60 px-4 py-2 text-center">
          <span className="text-red-300 text-sm font-semibold">
            {t('game.finishPending')}
          </span>
        </div>
      )}

      {/* Status message */}
      <div className="shrink-0 flex items-center justify-center px-4 py-0.5">
        <p className={`text-sm font-medium ${isMyTurn ? 'text-emerald-400' : 'text-ocean-400'}`}>
          {statusMessage}
        </p>
      </div>

      {/* Normal action area */}
      {isMyTurn && uiMode === 'default' && !startDiscardState && !pendingPlay && (
        <div className="shrink-0 px-4 pb-1 flex gap-2 justify-center flex-wrap">
          {selectedCard && (
            <button className="btn-ghost text-xs py-1.5" onClick={() => setSelectedCard(null)}>
              {t('game.deselect')}
            </button>
          )}
          {canDiscardTwo && (
            <button className="btn-danger text-sm py-2" onClick={() => { setSelectedCard(null); setDiscardTwoSelected(new Set()); setUiMode('selecting_discard_two'); }}>
              {t('game.discard2')}
            </button>
          )}
        </div>
      )}

      {/* Discard-two selection bar */}
      {uiMode === 'selecting_discard_two' && (
        <div className="shrink-0 bg-red-950/80 border-t border-red-800 px-4 py-2 text-center">
          <p className="text-red-300 text-sm mb-2">{t('game.selectDiscard', { count: discardTwoSelected.size })}</p>
          <div className="flex gap-2 justify-center">
            <button className="btn-ghost text-sm py-1.5" onClick={() => { setUiMode('default'); setDiscardTwoSelected(new Set()); }}>
              {t('game.cancel')}
            </button>
            <button
              className="btn-danger text-sm py-1.5"
              disabled={discardTwoSelected.size !== 2}
              onClick={handleDiscardTwoConfirm}
            >
              {t('game.confirmDiscard')}
            </button>
          </div>
        </div>
      )}

      {/* Discard cost bar — inline, replaces the fullscreen DiscardModal */}
      {pendingPlay && (
        <div className="shrink-0 bg-red-950/80 border-t border-red-800 px-4 py-2 text-center">
          <p className="text-red-300 text-sm mb-2">
            {t('discard.title')} — {t('discard.selected', { sel: discardCostSelected.size, req: pendingPlay.cost })}
          </p>
          <div className="flex gap-2 justify-center">
            <button className="btn-ghost text-sm py-1.5" onClick={() => { setPendingPlay(null); setDiscardCostSelected(new Set()); }}>
              {t('discard.cancel')}
            </button>
            <button
              className="btn-danger text-sm py-1.5"
              disabled={discardCostSelected.size !== pendingPlay.cost}
              onClick={handleDiscardCostConfirm}
            >
              {t('discard.confirm')}
            </button>
          </div>
        </div>
      )}

      {/* Start discard contributing bar — inline, replaces the fullscreen StartDiscardModal */}
      {startDiscardState?.isMyTurnToContribute && (
        <div className="shrink-0 bg-amber-950/80 border-t border-amber-800 px-4 py-2 text-center">
          <p className="text-amber-300 text-sm font-semibold mb-1">⚓ {t('startDiscard.title')}</p>
          <p className="text-amber-200/70 text-xs mb-2">
            {startDiscardMin > 0
              ? t('startDiscard.selectRange', { min: startDiscardMin, max: startDiscardMax, remaining: startDiscardState.remaining })
              : t('startDiscard.selectUp', { max: startDiscardMax, remaining: startDiscardState.remaining })}
          </p>
          <div className="flex items-center gap-3 justify-center">
            <span className="text-amber-400/70 text-sm">
              {t('startDiscard.contributing', { sel: startDiscardSelected.size, max: startDiscardMax })}
            </span>
            <button
              className="btn-primary text-sm py-1.5"
              disabled={startDiscardSelected.size < startDiscardMin}
              onClick={() => { onContributeStartDiscard([...startDiscardSelected]); setStartDiscardSelected(new Set()); }}
            >
              {t('startDiscard.contributeBtn', {
                n: startDiscardSelected.size,
                card: startDiscardSelected.size !== 1 ? t('discard.cards') : t('discard.card'),
              })}
            </button>
          </div>
        </div>
      )}

      {/* Start discard waiting bar */}
      {startDiscardState && !startDiscardState.isMyTurnToContribute && (
        <div className="shrink-0 bg-ocean-800/60 border-t border-ocean-700 px-4 py-2 text-center">
          <p className="text-ocean-300 text-sm">⚓ {t('startDiscard.waiting')}</p>
          <div className="flex justify-center gap-4 text-xs text-ocean-400 mt-1">
            <span>{t('startDiscard.theirContrib')}: <strong className="text-white">{startDiscardState.opponentContribution}</strong></span>
            <span>{t('startDiscard.stillNeeded')}: <strong className="text-red-400">{startDiscardState.remaining}</strong></span>
          </div>
        </div>
      )}

      {/* My hand */}
      <div id="game-footer" className="shrink-0 bg-ocean-900/80 border-t border-ocean-800 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] overflow-x-hidden">
        <div className="flex items-center justify-end gap-4 mb-1">
          <div className="flex items-center gap-2" data-id="self-name-chip">
            <div className={`w-2 h-2 rounded-full ${me.isCurrentPlayer ? 'bg-green-400 animate-pulse' : 'bg-ocean-600'}`} />
            {selfAvatar ? (
              <img
                src={selfAvatar}
                alt=""
                className="h-5 w-5 shrink-0 rounded-full object-cover"
                data-id="self-name-avatar"
              />
            ) : null}
            <span className="text-sm font-semibold text-white">{me.name} {t('game.you')}</span>
          </div>
          <div className="flex gap-4 text-xs text-ocean-400">
            <span title={t('game.hand')}>🤚 <strong className="text-white">{me.handSize}</strong></span>
            <span title={t('game.deck')}>🃏 <strong className="text-white">{me.deckSize}</strong></span>
          </div>
        </div>
        <Hand
          cards={myHand}
          selectedCardId={inSelectionMode ? null : selectedCard?.id ?? null}
          legalMoves={inSelectionMode ? [] : legalMoves}
          isMyTurn={isMyTurn}
          onSelect={handleCardClick}
          deckSize={me.deckSize}
          discardCount={me.discardCount}
          forceSelectable={inSelectionMode}
          additionalSelectedIds={handAdditionalSelected}
          nonSelectableIds={handNonSelectableIds}
          hideStats
        />
      </div>

      {showFinishFlourish && <FinishCardFlourish />}
      {showGameOver && winner && <GameOver winner={winner} onRematch={onRematch} onMenu={onMenu} />}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onRestartGame={onRematch}
          roomCode={gameState.roomId !== 'LOCAL' ? gameState.roomId : undefined}
        />
      )}
    </div>
  );
}

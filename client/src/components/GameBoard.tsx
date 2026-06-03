import React, { useState, useCallback } from 'react';
import type { ClientGameState, Card, LegalMove } from '@tranquillity/shared';
import { useT, LanguageSwitcher } from '../i18n';
import Grid from './Grid';
import Hand from './Hand';
import DiscardModal from './DiscardModal';
import StartDiscardModal from './StartDiscardModal';
import GameOver from './GameOver';

interface Props {
  gameState: ClientGameState;
  onPlayCard: (cardId: string, position: number, discardCardIds: string[]) => void;
  onDiscardTwo: (cardIds: [string, string]) => void;
  onContributeStartDiscard: (cardIds: string[]) => void;
  onRematch: () => void;
  onMenu: () => void;
  showingDiscardSelect?: boolean; // for "discard two" selection mode
}

type UIMode = 'default' | 'selecting_discard_two';

export default function GameBoard({ gameState, onPlayCard, onDiscardTwo, onContributeStartDiscard, onRematch, onMenu }: Props) {
  const t = useT();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [pendingPlay, setPendingPlay] = useState<{ card: Card; position: number; cost: number } | null>(null);
  const [uiMode, setUiMode] = useState<UIMode>('default');
  const [discardTwoSelected, setDiscardTwoSelected] = useState<Set<string>>(new Set());

  const { myHand, grid, legalMoves, canDiscardTwo, phase, currentPlayerIndex, myPlayerIndex, startDiscardState, winner, message } = gameState;
  const isMyTurn = currentPlayerIndex === myPlayerIndex && (phase === 'playing' || phase === 'finish_pending');
  const opponent = gameState.players[myPlayerIndex === 0 ? 1 : 0];
  const me = gameState.players[myPlayerIndex];

  // Filter legal moves for selected card
  const movesForSelected: LegalMove[] = selectedCard
    ? legalMoves.filter(m => m.cardId === selectedCard.id)
    : [];

  function handleCardSelect(card: Card) {
    if (!isMyTurn) return;
    if (uiMode === 'selecting_discard_two') {
      const next = new Set(discardTwoSelected);
      if (next.has(card.id)) { next.delete(card.id); }
      else if (next.size < 2) { next.add(card.id); }
      setDiscardTwoSelected(next);
      return;
    }
    setSelectedCard(prev => prev?.id === card.id ? null : card);
  }

  function handleCellClick(pos: number) {
    if (!selectedCard || !isMyTurn) return;
    const move = movesForSelected.find(m => m.position === pos);
    if (!move) return;

    if (move.discardCost === 0) {
      onPlayCard(selectedCard.id, pos, []);
      setSelectedCard(null);
    } else {
      setPendingPlay({ card: selectedCard, position: pos, cost: move.discardCost });
      setSelectedCard(null);
    }
  }

  function handleDiscardConfirm(discardIds: string[]) {
    if (!pendingPlay) return;
    onPlayCard(pendingPlay.card.id, pendingPlay.position, discardIds);
    setPendingPlay(null);
  }

  function handleDiscardTwoConfirm() {
    const ids = [...discardTwoSelected];
    if (ids.length !== 2) return;
    onDiscardTwo([ids[0], ids[1]]);
    setDiscardTwoSelected(new Set());
    setUiMode('default');
  }

  function enterDiscardTwoMode() {
    setSelectedCard(null);
    setDiscardTwoSelected(new Set());
    setUiMode('selecting_discard_two');
  }

  // Start card: if player has it and start not played → auto-highlight / force play
  const hasUnplayedStart = !gameState.startCardPlayed && myHand.some(c => c.type === 'start');
  const startMove = hasUnplayedStart ? legalMoves.find(m => legalMoves.find(lm => lm.position === -1)) : undefined;
  // Actually find start move properly:
  const startLegalMove = legalMoves.find(m => m.position === -1);

  function handleStartCardPlay(cardId: string) {
    onPlayCard(cardId, -1, []);
  }

  function handleFinishCardPlay(cardId: string) {
    onPlayCard(cardId, -1, []);
  }

  // Auto-handle start/finish card click: when selected and position is -1
  function handleCardClick(card: Card) {
    if (!isMyTurn) return;
    if (card.type === 'start' && legalMoves.some(m => m.cardId === card.id && m.position === -1)) {
      handleStartCardPlay(card.id);
      return;
    }
    if (card.type === 'finish' && legalMoves.some(m => m.cardId === card.id && m.position === -1)) {
      handleFinishCardPlay(card.id);
      return;
    }
    handleCardSelect(card);
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950">
      {/* Opponent info bar */}
      <header className="bg-ocean-900/80 border-b border-ocean-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
          <div className={`w-2 h-2 rounded-full ${me.isCurrentPlayer ? 'bg-green-400 animate-pulse' : 'bg-ocean-600'}`} />
          <span className="font-semibold text-white text-sm">{me.name} {t('game.you')}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs text-ocean-400">
            <span title={t('game.hand')}>🤚 <strong className="text-white">{me.handSize}</strong></span>
            <span title={t('game.deck')}>🃏 <strong className="text-white">{me.deckSize}</strong></span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Grid — takes all remaining space between header and hand */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-2 py-1 overflow-hidden">
        <Grid
          grid={grid}
          legalMoves={movesForSelected}
          selectedCard={selectedCard}
          onCellClick={handleCellClick}
          startCardPlayed={gameState.startCardPlayed}
        />
      </div>

      {/* finish_pending banner */}
      {phase === 'finish_pending' && (
        <div className="shrink-0 bg-red-950/80 border-b border-red-800/60 px-4 py-2 text-center">
          <span className="text-red-300 text-sm font-semibold">
            🐙 Finish card played — all Sea Monsters must be played before victory
          </span>
        </div>
      )}

      {/* Status message */}
      <div className="shrink-0 flex items-center justify-center px-4 py-0.5">
        <p className={`text-sm font-medium ${isMyTurn ? 'text-emerald-400' : 'text-ocean-400'}`}>
          {message}
        </p>
      </div>

      {/* Action area */}
      {isMyTurn && uiMode === 'default' && !startDiscardState && (
        <div className="shrink-0 px-4 pb-1 flex gap-2 justify-center flex-wrap">
          {selectedCard && (
            <button className="btn-ghost text-xs py-1.5" onClick={() => setSelectedCard(null)}>
              {t('game.deselect')}
            </button>
          )}
          {canDiscardTwo && (
            <button className="btn-danger text-sm py-2" onClick={enterDiscardTwoMode}>
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

      {/* My hand */}
      <div className="shrink-0 bg-ocean-900/80 border-t border-ocean-800 px-3 py-2">
        <div className="flex items-center justify-end gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${opponent.isCurrentPlayer ? 'bg-green-400 animate-pulse' : 'bg-ocean-600'}`} />
            <span className="text-sm font-semibold text-white">{opponent.name}</span>
          </div>
          <div className="flex gap-4 text-xs text-ocean-400">
            <span title={t('game.hand')}>🤚 <strong className="text-white">{opponent.handSize}</strong></span>
            <span title={t('game.deck')}>🃏 <strong className="text-white">{opponent.deckSize}</strong></span>
          </div>
        </div>
        <Hand
          cards={myHand}
          selectedCardId={uiMode === 'selecting_discard_two' ? null : selectedCard?.id ?? null}
          legalMoves={uiMode === 'selecting_discard_two' ? [] : legalMoves}
          isMyTurn={isMyTurn}
          onSelect={handleCardClick}
          deckSize={me.deckSize}
          discardCount={me.discardCount}
          forceSelectable={uiMode === 'selecting_discard_two'}
          additionalSelectedIds={uiMode === 'selecting_discard_two' ? discardTwoSelected : undefined}
          hideStats
        />
      </div>

      {/* Modals */}
      {startDiscardState && (
        <StartDiscardModal
          hand={myHand}
          startDiscard={startDiscardState}
          onContribute={onContributeStartDiscard}
        />
      )}

      {pendingPlay && (
        <DiscardModal
          cardToPlay={pendingPlay.card}
          handWithoutPlayed={myHand.filter(c => c.id !== pendingPlay.card.id)}
          requiredCount={pendingPlay.cost}
          onConfirm={handleDiscardConfirm}
          onCancel={() => setPendingPlay(null)}
        />
      )}

      {winner && (
        <GameOver winner={winner} onRematch={onRematch} onMenu={onMenu} />
      )}
    </div>
  );
}

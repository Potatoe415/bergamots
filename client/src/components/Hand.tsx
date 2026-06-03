import React from 'react';
import type { Card, LegalMove } from '@tranquillity/shared';
import CardComp from './CardComp';

interface Props {
  cards: Card[];
  selectedCardId: string | null;
  legalMoves: LegalMove[];
  isMyTurn: boolean;
  onSelect: (card: Card) => void;
  deckSize: number;
  discardCount: number;
}

export default function Hand({ cards, selectedCardId, legalMoves, isMyTurn, onSelect, deckSize, discardCount }: Props) {
  const playableIds = new Set(legalMoves.map(m => m.cardId));

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Stats row */}
      <div className="flex gap-4 text-xs text-ocean-300">
        <span>🃏 Deck: <strong className="text-white">{deckSize}</strong></span>
        <span>🗑️ Discarded: <strong className="text-white">{discardCount}</strong></span>
        <span>🤚 Hand: <strong className="text-white">{cards.length}</strong></span>
      </div>

      {/* Cards */}
      <div className="flex gap-2 flex-wrap justify-center">
        {cards.map(card => {
          const isPlayable = isMyTurn && playableIds.has(card.id);
          const isSelected = card.id === selectedCardId;
          // Min cost for this card across all positions
          const costs = legalMoves.filter(m => m.cardId === card.id).map(m => m.discardCost);
          const minCost = costs.length > 0 ? Math.min(...costs) : null;

          return (
            <CardComp
              key={card.id}
              card={card}
              size="md"
              selected={isSelected}
              dimmed={isMyTurn && !isPlayable && !isSelected}
              badge={isPlayable && minCost !== null && minCost > 0 ? `${minCost}` : undefined}
              onClick={() => isMyTurn && onSelect(card)}
              disabled={!isMyTurn || !isPlayable}
            />
          );
        })}
        {cards.length === 0 && (
          <div className="text-ocean-500 text-sm italic py-4">Empty hand</div>
        )}
      </div>
    </div>
  );
}

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
  forceSelectable?: boolean;
  additionalSelectedIds?: Set<string>;
  nonSelectableIds?: Set<string>;
  hideStats?: boolean;
}

export default function Hand({ cards, selectedCardId, legalMoves, isMyTurn, onSelect, deckSize, discardCount, forceSelectable, additionalSelectedIds, nonSelectableIds, hideStats }: Props) {
  const playableIds = new Set(legalMoves.map(m => m.cardId));

  return (
    <div id="hand" className="flex flex-col items-center gap-3">
      {!hideStats && (
        <div className="flex gap-4 text-xs text-ocean-300">
          <span>🃏 Deck: <strong className="text-white">{deckSize}</strong></span>
          <span>🗑️ Discarded: <strong className="text-white">{discardCount}</strong></span>
          <span>🤚 Hand: <strong className="text-white">{cards.length}</strong></span>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-ocean-500 text-sm italic py-4">Empty hand</div>
      ) : (
        <div
          className="grid w-full gap-1"
          style={{
            gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
            maxWidth: `${cards.length * 104}px`,
          }}
        >
          {cards.map(card => {
            const isExcluded = nonSelectableIds?.has(card.id) ?? false;
            const isForced = !isExcluded && !!forceSelectable;
            const isPlayable = isForced || (isMyTurn && playableIds.has(card.id));
            const isSelected = card.id === selectedCardId || (additionalSelectedIds?.has(card.id) ?? false);
            const canClick = isForced || isMyTurn;
            const costs = legalMoves.filter(m => m.cardId === card.id).map(m => m.discardCost);
            const minCost = costs.length > 0 ? Math.min(...costs) : null;
            const showDimmed = (isMyTurn || !!forceSelectable) && !isPlayable && !isSelected;

            return (
              <div key={card.id} className="aspect-square [container-type:inline-size]">
                <CardComp
                  card={card}
                  size="full"
                  selected={isSelected}
                  dimmed={showDimmed}
                  badge={isPlayable && !forceSelectable && minCost !== null && minCost > 0 ? `${minCost}` : undefined}
                  onClick={() => onSelect(card)}
                  disabled={!canClick || !isPlayable}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

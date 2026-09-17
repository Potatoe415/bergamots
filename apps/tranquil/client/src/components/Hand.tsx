import React from 'react';
import type { Card, LegalMove } from '@tranquillity/shared';
import CardComp from './CardComp';
import { useElementWidth } from '../lib/useElementWidth';

const CARD_GAP_PX = 4; // matches Tailwind's `gap-1`
const MAX_CARD_PX = 104;
const MIN_CARD_PX = 44; // keeps cards tappable — below this, scroll instead of shrinking further

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

interface RowLayout {
  cardSize: number;
  /** True once cards hit MIN_CARD_PX and no longer all fit — row must scroll. */
  overflowing: boolean;
}

/** Card width that fits `count` cards + gaps inside `rowWidth`, clamped to a sane
 * range. Below MIN_CARD_PX we stop shrinking (cards stay tappable) and let the
 * row scroll horizontally instead of clipping cards off-screen. */
function computeRowLayout(rowWidth: number, count: number): RowLayout {
  if (rowWidth <= 0 || count <= 0) return { cardSize: MAX_CARD_PX, overflowing: false };
  const gaps = CARD_GAP_PX * (count - 1);
  const idealSize = Math.floor((rowWidth - gaps) / count);
  const cardSize = Math.min(MAX_CARD_PX, Math.max(MIN_CARD_PX, idealSize));
  const overflowing = cardSize * count + gaps > rowWidth;
  return { cardSize, overflowing };
}

export default function Hand({ cards, selectedCardId, legalMoves, isMyTurn, onSelect, deckSize, discardCount, forceSelectable, additionalSelectedIds, nonSelectableIds, hideStats }: Props) {
  const playableIds = new Set(legalMoves.map(m => m.cardId));
  const [rowRef, rowWidth] = useElementWidth<HTMLDivElement>();
  const { cardSize, overflowing } = computeRowLayout(rowWidth, cards.length);

  return (
    <div id="hand" className="flex flex-col items-center gap-3 w-full min-w-0">
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
          ref={rowRef}
          className={`flex w-full min-w-0 gap-1 overflow-x-auto ${overflowing ? 'justify-start' : 'justify-center'}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
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
              <div
                key={card.id}
                className="shrink-0 [container-type:inline-size]"
                style={{ width: cardSize, height: cardSize }}
              >
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

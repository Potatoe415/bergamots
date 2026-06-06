import React from 'react';
import type { GridCell, LegalMove, Card } from '@tranquillity/shared';
import CardComp from './CardComp';

interface Props {
  grid: GridCell[];
  legalMoves: LegalMove[];
  selectedCard: Card | null;
  onCellClick: (pos: number) => void;
  opponentPlayPosition?: number;
  /** Card being placed that still requires a discard-cost payment. Shown semi-transparently so
   *  the player sees the card on the board before confirming the discard. */
  pendingPlayCard?: Card;
  pendingPlayPosition?: number;
}

export default function Grid({ grid, legalMoves, selectedCard, onCellClick, opponentPlayPosition, pendingPlayCard, pendingPlayPosition }: Props) {
  const legalPositions = new Set(legalMoves.map(m => m.position));

  const rows: number[][] = Array.from({ length: 6 }, (_, rowIdx) =>
    Array.from({ length: 6 }, (_, colIdx) => rowIdx * 6 + colIdx)
  );
  const allPositions = [...rows].reverse().flat();

  return (
    // Square sized to the smaller of container width/height via container query units.
    <div id="grid" className="w-[min(100cqw,100cqh)] aspect-square bg-ocean-900/60 rounded-2xl p-2 border border-ocean-700/50 shadow-2xl">
      <div className="grid grid-cols-6 grid-rows-6 w-full h-full gap-0.5">
        {allPositions.map(pos => {
          const cell = grid[pos];
          const isLegal = selectedCard !== null && legalPositions.has(pos);
          const move = isLegal ? legalMoves.find(m => m.position === pos) : undefined;
          const isOpponentPlay = pos === opponentPlayPosition;
          const isPendingPlay = pendingPlayCard !== undefined && pos === pendingPlayPosition;

          return (
            <div
              key={pos}
              className={[
                'rounded-lg overflow-hidden flex items-center justify-center min-w-0',
                'border transition-all duration-150',
                isPendingPlay
                  ? 'border-yellow-400/70 ring-2 ring-yellow-400/50'
                  : isOpponentPlay
                  ? 'border-red-400/90 ring-2 ring-red-300/70 scale-110 bg-red-950/60 animate-pulse'
                  : cell.card && isLegal
                  ? 'border-red-500/80 ring-2 ring-red-400/60 cursor-pointer scale-95'
                  : cell.card
                  ? 'border-transparent'
                  : isLegal
                  ? 'border-yellow-400/70 bg-yellow-400/10 cursor-pointer cell-highlight animate-pulse-slow'
                  : 'border-ocean-700/40 bg-ocean-800/30',
              ].join(' ')}
              onClick={() => isLegal && onCellClick(pos)}
            >
              {cell.card ? (
                <CardComp card={cell.card} size="full" disabled />
              ) : isPendingPlay ? (
                <div className="opacity-50 w-full h-full">
                  <CardComp card={pendingPlayCard!} size="full" disabled />
                </div>
              ) : isOpponentPlay ? (
                <span className="text-3xl leading-none select-none animate-fade-in-scale">🐙</span>
              ) : isLegal ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-yellow-300 text-xs">+</span>
                  {move && move.discardCost > 0 && (
                    <span className="text-[9px] text-red-300 font-bold">-{move.discardCost}</span>
                  )}
                </div>
              ) : (
                <span className="text-ocean-700 text-xs opacity-30">·</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

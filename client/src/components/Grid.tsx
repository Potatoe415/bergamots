import React from 'react';
import type { GridCell, LegalMove, Card } from '@tranquillity/shared';
import CardComp from './CardComp';

interface Props {
  grid: GridCell[];
  legalMoves: LegalMove[];
  selectedCard: Card | null;
  onCellClick: (pos: number) => void;
  opponentPlayPosition?: number;
}

export default function Grid({ grid, legalMoves, selectedCard, onCellClick, opponentPlayPosition }: Props) {
  const legalPositions = new Set(legalMoves.map(m => m.position));

  const rows: number[][] = Array.from({ length: 6 }, (_, rowIdx) =>
    Array.from({ length: 6 }, (_, colIdx) => rowIdx * 6 + colIdx)
  );
  const allPositions = [...rows].reverse().flat();

  return (
    // Mobile: full-width square (height driven by width).
    // Desktop: height-driven square (max height of flex-1 parent).
    <div id="grid" className="aspect-square h-full max-h-full w-auto max-w-full bg-ocean-900/60 rounded-2xl p-2 border border-ocean-700/50 shadow-2xl">
      <div className="grid grid-cols-6 grid-rows-6 w-full h-full gap-0.5">
        {allPositions.map(pos => {
          const cell = grid[pos];
          const isLegal = selectedCard !== null && legalPositions.has(pos);
          const move = isLegal ? legalMoves.find(m => m.position === pos) : undefined;
          const isOpponentPlay = pos === opponentPlayPosition;

          return (
            <div
              key={pos}
              className={[
                'rounded-lg overflow-hidden flex items-center justify-center min-w-0',
                'border transition-all duration-150',
                isOpponentPlay
                  ? 'border-amber-400/80 ring-2 ring-amber-300/60 scale-105 animate-pulse'
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

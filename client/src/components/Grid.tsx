import React from 'react';
import type { GridCell, LegalMove, Card } from '@tranquillity/shared';
import CardComp from './CardComp';

interface Props {
  grid: GridCell[];
  legalMoves: LegalMove[];        // for the selected card
  selectedCard: Card | null;
  onCellClick: (pos: number) => void;
  startCardPlayed: boolean;
}

export default function Grid({ grid, legalMoves, selectedCard, onCellClick, startCardPlayed }: Props) {
  const legalPositions = new Set(legalMoves.map(m => m.position));

  // Grid rows: bottom row = positions 0-5, top row = 30-35
  // In DOM we render top row first (row index 5 down to 0)
  const rows: number[][] = Array.from({ length: 6 }, (_, rowIdx) =>
    Array.from({ length: 6 }, (_, colIdx) => rowIdx * 6 + colIdx)
  );
  const displayRows = [...rows].reverse(); // top row rendered first

  const allPositions = displayRows.flat();

  return (
    <div className="flex flex-col gap-0.5 w-full h-full md:aspect-square md:w-auto">
      {/* Filled indicator */}
      <div className="shrink-0 text-xs text-white/40 mb-0.5 text-center">
        {grid.filter(c => c.card).length} / 36 cells filled
      </div>

      {/* Grid — always square: container-type:size exposes cqw/cqh, then
          min(100cqw,100cqh) picks the smaller dimension so the board is a
          perfect square regardless of portrait vs landscape layout. */}
      <div className="flex-1 min-h-0 min-w-0 [container-type:size] flex items-center justify-center">
        <div
          className="bg-ocean-900/60 rounded-2xl p-2 border border-ocean-700/50 shadow-2xl"
          style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}
        >
          <div className="grid grid-cols-6 gap-0.5 md:grid-rows-6 md:h-full">
            {allPositions.map(pos => {
                const cell = grid[pos];
                const isLegal = selectedCard !== null && legalPositions.has(pos);
                const move = isLegal ? legalMoves.find(m => m.position === pos) : undefined;

                return (
                  <div
                    key={pos}
                    className={[
                      'aspect-square md:aspect-auto rounded-lg overflow-hidden flex items-center justify-center min-w-0',
                      'border transition-all duration-150',
                      cell.card && isLegal
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
      </div>

      {/* Start card indicator */}
      <div className="shrink-0 mt-0.5 flex items-center gap-2">
        <div className={[
          'px-3 py-1 rounded-full text-xs font-semibold border',
          startCardPlayed
            ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
            : 'bg-ocean-800/50 border-ocean-700/40 text-ocean-400',
        ].join(' ')}>
          {startCardPlayed ? '⚓ Start played' : '⚓ Start pending'}
        </div>
      </div>
    </div>
  );
}

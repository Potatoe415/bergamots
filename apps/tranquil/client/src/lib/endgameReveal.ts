import { useEffect, useState } from 'react';
import type { Card, ClientGameState, GridCell } from '@tranquillity/shared';

/** How long the final board stays visible before the game-over overlay. */
export const GAME_OVER_REVEAL_MS = 2000;

export function findLastGridChange(
  grid: GridCell[],
  prevGrid: GridCell[],
): { card: Card; position: number } | null {
  const placed = grid.find((cell, i) => cell.card && !prevGrid[i]?.card);
  if (placed?.card) return { card: placed.card, position: placed.position };
  const clearedIdx = grid.findIndex((cell, i) => !cell.card && prevGrid[i]?.card);
  if (clearedIdx < 0) return null;
  return { card: prevGrid[clearedIdx].card!, position: clearedIdx };
}

/** Keep the final board visible for a beat before the overlay covers it. */
export function useDelayedGameOver(winner: ClientGameState['winner']): boolean {
  const [show, setShow] = useState(() => Boolean(winner));
  useEffect(() => {
    if (!winner) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), GAME_OVER_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [winner]);
  return Boolean(winner) && show;
}

import type { Card, SlapPattern } from "./types";

/** Detects a live slap opportunity on top of the pile (last element = top):
 *  - "double": the top 2 cards share the same rank.
 *  - "sandwich": the top card and the one 2 below it share the same rank
 *    (exactly one different card in between).
 *  Double takes priority when both happen to be true at once - the exact
 *  label barely matters gameplay-wise, either lets both seats attempt a slap. */
export function detectSlapPattern(pile: Card[]): SlapPattern | null {
  const n = pile.length;
  if (n >= 2 && pile[n - 1].rank === pile[n - 2].rank) return "double";
  if (n >= 3 && pile[n - 1].rank === pile[n - 3].rank) return "sandwich";
  return null;
}

import { isChallengeRank } from "./cards";
import type { Card, SlapPattern } from "./types";

/** Same double/sandwich test, run against whichever card sequence is passed
 *  in - either the real pile, or the figure/ace-only sequence below. */
function detectOnSequence(cards: Card[]): SlapPattern | null {
  const n = cards.length;
  if (n >= 2 && cards[n - 1].rank === cards[n - 2].rank) return "double";
  if (n >= 3 && cards[n - 1].rank === cards[n - 3].rank) return "sandwich";
  return null;
}

/** Detects a live slap opportunity on top of the pile (last element = top):
 *  - "double": the top 2 cards share the same rank.
 *  - "sandwich": the top card and the one 2 below it share the same rank
 *    (exactly one different card in between).
 *  When the top card is itself a figure/ace, the same two checks also run
 *  again on the pile filtered down to just figure/ace cards: while a tribute
 *  is being paid, a seat's own plain attempts (see `resolveTributeEffect`)
 *  sit between the challenge card and whichever later figure/ace actually
 *  answers it - e.g. As, 3, 5, 9, As. Those plain filler cards don't break
 *  the pattern for the figures themselves: an As "right after" an As, or a
 *  Valet right after a Valet, still counts even with ordinary attempts in
 *  between (see docs/DECISIONS.md). Guarding on the real top card being a
 *  figure/ace keeps this from resurrecting a stale figure/ace pair once an
 *  unrelated plain card has since been played on top of it.
 *  Double takes priority when both happen to be true at once - the exact
 *  label barely matters gameplay-wise, either lets both seats attempt a slap. */
export function detectSlapPattern(pile: Card[]): SlapPattern | null {
  const direct = detectOnSequence(pile);
  if (direct) return direct;
  const top = pile[pile.length - 1];
  if (!top || !isChallengeRank(top.rank)) return null;
  return detectOnSequence(pile.filter((c) => isChallengeRank(c.rank)));
}

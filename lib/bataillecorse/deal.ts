import { shuffle, type Rng } from "@/lib/cards";
import { buildDeck } from "./cards";
import type { Card } from "./types";

/** Splits a shuffled 52-card deck evenly between the two stocks. Neither
 *  player ever looks at their own stock's order (see docs/PRODUCT.md) - the
 *  split point is arbitrary since the deck is already shuffled. */
export function deal(rng: Rng = Math.random): [Card[], Card[]] {
  const deck = shuffle(buildDeck(), rng);
  const half = deck.length / 2;
  return [deck.slice(0, half), deck.slice(half)];
}

import { shuffle, type Rng } from "@/lib/cards";
import { buildDeck, DEFAULT_DECK_SIZE } from "./cards";
import type { Card, DeckSize } from "./types";

/** Splits a shuffled deck (32 or 54 cards, see `DeckSize`) evenly between the
 *  two stocks. Neither player ever looks at their own stock's order (see
 *  docs/PRODUCT.md) - the split point is arbitrary since the deck is already
 *  shuffled. */
export function deal(rng: Rng = Math.random, deckSize: DeckSize = DEFAULT_DECK_SIZE): [Card[], Card[]] {
  const deck = shuffle(buildDeck(deckSize), rng);
  const half = deck.length / 2;
  return [deck.slice(0, half), deck.slice(half)];
}

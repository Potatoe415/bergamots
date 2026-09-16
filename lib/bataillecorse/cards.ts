import { buildDeck as buildDeckGeneric, cardId as cardIdGeneric, sameCard as sameCardGeneric } from "@/lib/cards";
import type { Card, DeckSize, Rank } from "./types";

export { shuffle } from "@/lib/cards";

/** Display/deal order only - no rank ever "outranks" another in this game
 *  (winning is purely about tributes/slaps, not card strength). */
export const RANK_ORDER: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "JOKER"];

/** Ranks dealt for each deck size (see `DeckSize`): 32 = piquet-style (7 and
 *  up, no jokers), 54 = the full pack. Jokers are added separately below
 *  (they have no natural suit, see `buildDeck`). */
const RANKS_BY_DECK_SIZE: Record<DeckSize, Rank[]> = {
  32: ["7", "8", "9", "10", "J", "Q", "K", "A"],
  54: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"],
};

export const DEFAULT_DECK_SIZE: DeckSize = 54;
export const DECK_SIZE_OPTIONS: DeckSize[] = [32, 54];

/** Tribute attempts per challenge rank (see docs/DECISIONS.md - "classic"
 *  ruleset, plus the joker's traditional 5 attempts once the 54-card deck
 *  brought jokers into play). */
const TRIBUTE_ATTEMPTS: Partial<Record<Rank, number>> = { J: 1, Q: 2, K: 3, A: 4, JOKER: 5 };

/** The 2 jokers have no natural suit - `S`/`H` here only keep their `cardId`s
 *  distinct from each other, never rendered as an actual suit (see
 *  `PlayingCard.tsx`'s `card.rank === "JOKER"` special case). */
const JOKERS: Card[] = [
  { rank: "JOKER", suit: "S" },
  { rank: "JOKER", suit: "H" },
];

export function buildDeck(deckSize: DeckSize = DEFAULT_DECK_SIZE): Card[] {
  const deck = buildDeckGeneric(RANKS_BY_DECK_SIZE[deckSize]);
  return deckSize === 54 ? [...deck, ...JOKERS] : deck;
}

export function cardId(card: Card): string {
  return cardIdGeneric(card);
}

export function sameCard(a: Card, b: Card): boolean {
  return sameCardGeneric(a, b);
}

/** Whether `rank` opens/continues a tribute (Jack/Queen/King/Ace/Joker). */
export function isChallengeRank(rank: Rank): boolean {
  return rank in TRIBUTE_ATTEMPTS;
}

/** Attempts allowed to answer a tribute opened by `rank` (0 for a non-challenge rank). */
export function attemptsFor(rank: Rank): number {
  return TRIBUTE_ATTEMPTS[rank] ?? 0;
}

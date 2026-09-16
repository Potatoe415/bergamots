import { buildDeck as buildDeckGeneric, cardId as cardIdGeneric, sameCard as sameCardGeneric } from "@/lib/cards";
import type { Card, DeckSize, Rank } from "./types";

export { shuffle } from "@/lib/cards";

/** Display/deal order only - no rank ever "outranks" another in this game
 *  (winning is purely about tributes/slaps, not card strength). */
export const RANK_ORDER: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

/** Ranks dealt for each deck size (see `DeckSize`): 32 = piquet-style (7 and
 *  up), 52 = the full pack. No jokers either way (see docs/DECISIONS.md). */
const RANKS_BY_DECK_SIZE: Record<DeckSize, Rank[]> = {
  32: ["7", "8", "9", "10", "J", "Q", "K", "A"],
  52: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"],
};

export const DEFAULT_DECK_SIZE: DeckSize = 52;
export const DECK_SIZE_OPTIONS: DeckSize[] = [32, 52];

/** Tribute attempts per challenge rank (see docs/DECISIONS.md - "classic" ruleset). */
const TRIBUTE_ATTEMPTS: Partial<Record<Rank, number>> = { J: 1, Q: 2, K: 3, A: 4 };

export function buildDeck(deckSize: DeckSize = DEFAULT_DECK_SIZE): Card[] {
  return buildDeckGeneric(RANKS_BY_DECK_SIZE[deckSize]);
}

export function cardId(card: Card): string {
  return cardIdGeneric(card);
}

export function sameCard(a: Card, b: Card): boolean {
  return sameCardGeneric(a, b);
}

/** Whether `rank` opens/continues a tribute (Jack/Queen/King/Ace). */
export function isChallengeRank(rank: Rank): boolean {
  return rank in TRIBUTE_ATTEMPTS;
}

/** Attempts allowed to answer a tribute opened by `rank` (0 for a non-challenge rank). */
export function attemptsFor(rank: Rank): number {
  return TRIBUTE_ATTEMPTS[rank] ?? 0;
}
